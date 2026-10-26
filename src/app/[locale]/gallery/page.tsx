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
import { galleryCategoryLabels, isGalleryCategory } from "@/utils/gallery";
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

const categoryTabs = [
  { label: "全部", href: "/gallery", value: undefined },
  { label: "写实", href: "/gallery?category=realistic", value: "realistic" },
  { label: "动漫", href: "/gallery?category=anime", value: "anime" },
  { label: "艺术", href: "/gallery?category=art", value: "art" },
  { label: "其他", href: "/gallery?category=other", value: "other" },
] as const;

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
          <h1 className="page-title">探索社区创作者的精彩作品</h1>
        </section>

        <nav className={styles.gallery__tabs} aria-label="作品分类">
          {categoryTabs.map((tab) => {
            const active = category === tab.value || (!category && !tab.value);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={clsx(styles.gallery__tab, active && styles.gallery__tabActive)}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {images.length > 0 ? (
          <>
            <section className={styles.gallery__masonry} aria-label="社区作品">
              {images.map((item) => {
                const asset = item.generatedImage.thumbnailAsset || item.generatedImage.outputAsset;
                const authorName =
                  item.userProfile.username || item.userProfile.user?.name || "创作者";

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
                        <span>{galleryCategoryLabels[item.category]}</span>
                        <span>
                          {format.dateTime(parseJavaDateTime(item.createdAt), "monthDay")}
                        </span>
                      </div>
                      <h2 className={styles.gallery__cardTitle}>{item.title || "未命名作品"}</h2>
                      <p className={styles.gallery__prompt}>{item.prompt}</p>
                      <p className={styles.gallery__author}>by {authorName}</p>
                    </div>
                  </article>
                );
              })}
            </section>
            <AppPagination current={page} pageSize={pageSize} total={galleryPage.total} />
          </>
        ) : (
          <section className={styles.gallery__empty}>
            <p className={styles.gallery__emptyLabel}>暂无公开作品</p>
            <h2 className={styles.gallery__emptyTitle}>第一批社区作品，等你发布。</h2>
            <p className={styles.gallery__emptyText}>
              在创作历史里点击“投稿到画廊”，审核通过后作品会出现在这里。
            </p>
            <Link href="/generate" className={styles.gallery__emptyAction}>
              开始创作
            </Link>
          </section>
        )}
      </main>
    </>
  );
}
