import clsx from "clsx";
import type { Metadata } from "next";
import Image from "next/image";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { AppPagination } from "@/components/ui/app-pagination";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { imageGallery } from "@/lib/structured-data";
import { requestJava } from "@/server/java-api";
import type { PageResult } from "@/types/api";
import type { GalleryCategory, GalleryImage } from "@/types/gallery";
import { isGalleryCategory } from "@/utils/gallery";
import { parseJavaDateTime } from "@/utils/java-time";
import { publicAssetUrl } from "@/utils/media";
import styles from "./gallery.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata.gallery");

  return buildMetadata({
    locale,
    path: "/gallery",
    title: t("title"),
    description: t("description"),
  });
}

const categoryTabs: GalleryCategory[] = ["realistic", "anime", "art", "other"];

type GalleryPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    page?: string | string[];
    pageSize?: string | string[];
  }>;
};

const defaultPageSize = 20;
const pageSizes = [10, 20, 50];

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeCategory(value?: string | string[]): GalleryCategory | undefined {
  const category = readParam(value);
  if (isGalleryCategory(category)) {
    return category;
  }

  return undefined;
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

export default async function GalleryPage(props: GalleryPageProps) {
  const searchParams = props.searchParams;
  const params = await searchParams;
  const category = normalizeCategory(params.category);
  const page = normalizePage(readParam(params.page));
  const pageSize = normalizePageSize(readParam(params.pageSize));
  const galleryPage = await requestJava<PageResult<GalleryImage>>("/gallery/public/images", {
    params: { pageNo: page, pageSize, category },
  });
  const images = galleryPage.list;
  const locale = await getLocale();
  const tMeta = await getTranslations("metadata.gallery");
  const t = await getTranslations("gallery");
  const tCommon = await getTranslations("common");
  const format = await getFormatter();

  const galleryItems = images.map((item) => {
    const authorName = item.userProfile.username || item.userProfile.user?.name || undefined;

    return {
      imageUrl: publicAssetUrl(item.generatedImageId),
      name: item.title || item.prompt,
      description: item.prompt,
      authorName,
      datePublished: parseJavaDateTime(item.createdAt).toISOString(),
      width: item.generatedImage.width || undefined,
      height: item.generatedImage.height || undefined,
    };
  });
  const galleryJsonLd = imageGallery({
    locale,
    path: "/gallery",
    name: tMeta("title"),
    description: tMeta("description"),
    items: galleryItems,
  });

  return (
    <>
      <JsonLd data={galleryJsonLd} />
      <ProductTopNav />
      <main className={styles.gallery}>
        <section className={styles.gallery__hero}>
          <h1 className="page-title">{t("hero.title")}</h1>
        </section>

        <nav className={styles.gallery__tabs} aria-label={t("tabs.label")}>
          <div className={styles.gallery__tabsTrack}>
            <Link
              href="/gallery"
              className={clsx(styles.gallery__tab, !category && styles.gallery__tabActive)}
              aria-current={!category ? "page" : undefined}
            >
              {t("tabs.all")}
            </Link>
            {categoryTabs.map((tab) => {
              const active = category === tab;
              return (
                <Link
                  key={tab}
                  href={`/gallery?category=${tab}`}
                  className={clsx(styles.gallery__tab, active && styles.gallery__tabActive)}
                  aria-current={active ? "page" : undefined}
                >
                  {t(`category.${tab}`)}
                </Link>
              );
            })}
          </div>
        </nav>

        {images.length > 0 ? (
          <>
            <section className={styles.gallery__masonry} aria-label={t("list.label")}>
              {images.map((item) => {
                const asset = item.generatedImage.thumbnailAsset || item.generatedImage.outputAsset;
                const authorName =
                  item.userProfile.username || item.userProfile.user?.name || t("card.anonymous");

                return (
                  <article key={item.id} className={styles.gallery__card}>
                    <Image
                      className={styles.gallery__image}
                      src={publicAssetUrl(item.generatedImageId)}
                      alt={item.title || item.prompt}
                      width={item.generatedImage.width || asset.width || 768}
                      height={item.generatedImage.height || asset.height || 768}
                      unoptimized
                    />

                    <div className={styles.gallery__cardBody}>
                      <div className={styles.gallery__cardMeta}>
                        <span>{t(`category.${item.category}`)}</span>
                        <span>
                          {format.dateTime(parseJavaDateTime(item.createdAt), "monthDay")}
                        </span>
                      </div>
                      <h2 className={styles.gallery__cardTitle}>
                        {item.title || t("card.untitled")}
                      </h2>
                      <p className={styles.gallery__prompt}>{item.prompt}</p>
                      <p className={styles.gallery__author} title={authorName}>
                        {t("card.author", { name: authorName })}
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>
            <AppPagination current={page} pageSize={pageSize} total={galleryPage.total} />
          </>
        ) : (
          <section className={styles.gallery__empty}>
            <p className={styles.gallery__emptyLabel}>{t("empty.label")}</p>
            <h2 className={styles.gallery__emptyTitle}>{t("empty.title")}</h2>
            <p className={styles.gallery__emptyText}>{t("empty.text")}</p>
            <Link href="/generate" className={styles.gallery__emptyAction}>
              {tCommon("actions.startCreating")}
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
