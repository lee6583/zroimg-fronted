import clsx from "clsx";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import { AppPagination } from "@/components/ui/app-pagination";
import { requestJava } from "@/server/java-api";
import type { PageResult } from "@/types/api";
import type { GalleryCategory, GalleryImage } from "@/types/gallery";
import { galleryCategoryLabels, isGalleryCategory } from "@/utils/gallery";
import { publicAssetUrl } from "@/utils/media";
import styles from "./gallery.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "作品画廊 | ZroImg",
  description:
    "浏览 ZroImg 社区创作者公开发布的 AI 生成图片作品，按写实、动漫、艺术等分类探索灵感。",
  openGraph: {
    title: "作品画廊 | ZroImg",
    description: "浏览 ZroImg 社区创作者公开发布的 AI 生成图片作品。",
    type: "website",
  },
};

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
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

  return (
    <>
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
                        <span>{formatDate(item.createdAt)}</span>
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
