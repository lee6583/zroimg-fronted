import clsx from "clsx";
import { Send } from "lucide-react";
import { AppPagination } from "@/components/ui/app-pagination";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { SubmissionActions } from "@/features/gallery/submission-actions";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PageResult } from "@/types/api";
import type { GalleryStatus, GallerySubmission, GallerySubmissionQuery } from "@/types/gallery";
import {
  formatGalleryTime,
  galleryCategoryLabels,
  galleryStatusLabels,
  isGalleryStatus,
} from "@/utils/gallery";
import styles from "./submissions.module.css";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

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

  return (
    <main className={styles.submissions}>
      <section className={styles.submissions__header}>
        <h1 className="page-title">我的投稿</h1>
      </section>

      <nav className={styles.submissions__tabs} aria-label="投稿状态">
        <Link
          href={statusHref()}
          className={clsx(styles.submissions__tab, !status && styles.submissions__tabActive)}
        >
          全部
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
            >
              {galleryStatusLabels[item]}
            </Link>
          );
        })}
      </nav>

      {submissions.length > 0 ? (
        <>
          <section className={styles.submissions__grid} aria-label="投稿列表">
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
                        {galleryStatusLabels[item.status]}
                      </span>
                      <span>{galleryCategoryLabels[item.category]}</span>
                    </div>

                    <p className={styles.submissions__prompt} title={item.prompt}>
                      {item.prompt}
                    </p>

                    {hasReason ? (
                      <p className={styles.submissions__reason}>
                        原因：{item.rejectReason || "未填写"}
                        {item.status === "removed" ? (
                          <>
                            ，如有疑问请提交
                            <Link href="/tickets" className={styles.submissions__reasonLink}>
                              意见反馈
                            </Link>
                          </>
                        ) : null}
                      </p>
                    ) : null}

                    <dl className={styles.submissions__times}>
                      <div>
                        <dt>投稿</dt>
                        <dd>{formatGalleryTime(item.submitTime)}</dd>
                      </div>
                      <div>
                        <dt>审核</dt>
                        <dd>{formatGalleryTime(item.reviewTime)}</dd>
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
          <h2 className={styles.submissions__emptyTitle}>暂无投稿</h2>
          <Link href="/history" className={styles.submissions__emptyAction}>
            去创作历史投稿
          </Link>
        </section>
      )}
    </main>
  );
}
