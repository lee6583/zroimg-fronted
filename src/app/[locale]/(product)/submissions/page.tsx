import clsx from "clsx";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Send } from "lucide-react";
import { AppPagination } from "@/components/ui/app-pagination";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { SubmissionActions } from "@/features/gallery/submission-actions";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PageResult } from "@/types/api";
import type { GalleryStatus, GallerySubmission, GallerySubmissionQuery } from "@/types/gallery";
import { isGalleryStatus } from "@/utils/gallery";
import { parseJavaDateTime } from "@/utils/java-time";
import styles from "./submissions.module.css";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("submissions.meta");
  return { title: t("title") };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type SubmissionsPageProps = {
  searchParams: SearchParams;
};

const statusTabs: GalleryStatus[] = ["pending", "approved", "rejected", "removed"];
const defaultPageSize = 10;
const pageSizes = [10, 20, 50];

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizePage(value?: string) {
  const page = Number(value || 1);
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.floor(page));
}

function normalizePageSize(value?: string) {
  const size = Number(value || defaultPageSize);
  if (pageSizes.includes(size)) {
    return size;
  }

  return defaultPageSize;
}

function statusHref(status?: GalleryStatus) {
  if (!status) {
    return "/submissions";
  }

  return `/submissions?status=${status}`;
}

export default async function SubmissionsPage(props: SubmissionsPageProps) {
  const searchParams = props.searchParams;
  const params = await searchParams;
  const rawStatus = readParam(params, "status");
  const status = isGalleryStatus(rawStatus) ? rawStatus : undefined;
  const page = normalizePage(readParam(params, "page"));
  const pageSize = normalizePageSize(readParam(params, "pageSize"));

  await requireUser();
  const query: GallerySubmissionQuery = { pageNo: page, pageSize, status };
  const submissionPage = await requestJava<PageResult<GallerySubmission>>(
    "/gallery/user/submissions",
    { params: query },
  );
  const submissions = submissionPage.list;
  const t = await getTranslations("submissions");
  const tGallery = await getTranslations("gallery");
  const format = await getFormatter();

  function formatTime(value: string | null) {
    if (!value) {
      return "-";
    }

    return format.dateTime(parseJavaDateTime(value), "datetime");
  }

  return (
    <main className={styles.submissions}>
      <section className={styles.submissions__header}>
        <h1 className="page-title">{t("title")}</h1>
      </section>

      <nav className={styles.submissions__tabs} aria-label={t("tabs.label")}>
        <Link
          href={statusHref()}
          className={clsx(styles.submissions__tab, !status && styles.submissions__tabActive)}
          aria-current={!status ? "page" : undefined}
        >
          {t("tabs.all")}
        </Link>
        {statusTabs.map((item) => {
          return (
            <Link
              key={item}
              href={statusHref(item)}
              className={clsx(
                styles.submissions__tab,
                status === item && styles.submissions__tabActive,
              )}
              aria-current={status === item ? "page" : undefined}
            >
              {tGallery(`status.${item}`)}
            </Link>
          );
        })}
      </nav>

      {submissions.length > 0 ? (
        <>
          <section className={styles.submissions__grid} aria-label={t("list.label")}>
            {submissions.map((item) => {
              const hasReason = item.status === "rejected" || item.status === "removed";

              return (
                <article key={item.id} className={styles.submissions__card}>
                  <ImageLightbox
                    src={item.imageUrl}
                    alt={item.prompt}
                    width={768}
                    height={768}
                    triggerClassName={styles.submissions__preview}
                    imageClassName={styles.submissions__image}
                  />

                  <div className={styles.submissions__body}>
                    <div className={styles.submissions__meta}>
                      <span
                        className={clsx(
                          styles.submissions__status,
                          item.status === "pending" && styles.submissions__statusPending,
                          item.status === "approved" && styles.submissions__statusApproved,
                          hasReason && styles.submissions__statusDanger,
                        )}
                      >
                        {tGallery(`status.${item.status}`)}
                      </span>
                      <span>{tGallery(`category.${item.category}`)}</span>
                    </div>

                    <p className={styles.submissions__prompt} title={item.prompt}>
                      {item.prompt}
                    </p>

                    {hasReason ? (
                      <p className={styles.submissions__reason}>
                        {item.status === "removed"
                          ? t.rich("reason.removed", {
                              reason: item.rejectReason || t("reason.empty"),
                              link: (chunks) => (
                                <Link href="/tickets" className={styles.submissions__reasonLink}>
                                  {chunks}
                                </Link>
                              ),
                            })
                          : t("reason.rejected", {
                              reason: item.rejectReason || t("reason.empty"),
                            })}
                      </p>
                    ) : null}

                    <dl className={styles.submissions__times}>
                      <div>
                        <dt>{t("times.submit")}</dt>
                        <dd>{formatTime(item.submitTime)}</dd>
                      </div>
                      <div>
                        <dt>{t("times.review")}</dt>
                        <dd>{formatTime(item.reviewTime)}</dd>
                      </div>
                    </dl>

                    <div className={styles.submissions__actions}>
                      <SubmissionActions submission={item} />
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <AppPagination current={page} pageSize={pageSize} total={submissionPage.total} />
        </>
      ) : (
        <section className={styles.submissions__empty}>
          <span className={styles.submissions__emptyIcon}>
            <Send size={26} />
          </span>
          <h2 className={styles.submissions__emptyTitle}>{t("empty.title")}</h2>
          <Link href="/history" className={styles.submissions__emptyAction}>
            {t("empty.action")}
          </Link>
        </section>
      )}
    </main>
  );
}
