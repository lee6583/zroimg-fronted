import Image from "next/image";
import Link from "next/link";
import { MainNav } from "@/components/layout/main-nav";
import { listPublicGalleryImages, normalizeGalleryCategory } from "@/server/bff/generation";
import { getMediaSignedUrl } from "@/server/bff/generation";
import styles from "./gallery.module.css";

export const dynamic = "force-dynamic";

const categoryTabs = [
  { label: "全部", href: "/gallery", value: undefined },
  { label: "写实", href: "/gallery?category=realistic", value: "realistic" },
  { label: "动漫", href: "/gallery?category=anime", value: "anime" },
  { label: "艺术", href: "/gallery?category=art", value: "art" },
  { label: "其他", href: "/gallery?category=other", value: "other" },
] as const;

const categoryLabels: Record<string, string> = {
  realistic: "写实",
  anime: "动漫",
  art: "艺术",
  other: "其他",
};

function joinClassNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const params = await searchParams;
  const activeCategory = normalizeGalleryCategory(params.category);
  const galleryImages = await listPublicGalleryImages(activeCategory);
  const imageUrls = new Map<string, string>();

  for (const item of galleryImages) {
    const asset = item.generatedImage.thumbnailAsset || item.generatedImage.outputAsset;
    imageUrls.set(asset.id, await getMediaSignedUrl(asset.id));
  }

  return (
    <>
      <MainNav />
      <main className={styles.gallery}>
        <section className={styles.gallery__hero}>
          <p className={styles.gallery__eyebrow}>Gallery</p>
          <h1 className={styles.gallery__title}>探索社区创作者的精彩作品</h1>
          <p className={styles.gallery__description}>
            从一句提示词到一张成片，看看其他创作者如何把想象变成画面。
          </p>
        </section>

        <nav className={styles.gallery__tabs} aria-label="作品分类">
          {categoryTabs.map((tab) => {
            const active = activeCategory === tab.value || (!activeCategory && !tab.value);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={joinClassNames(styles.gallery__tab, active && styles.gallery__tabActive)}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {galleryImages.length > 0 ? (
          <section className={styles.gallery__masonry} aria-label="社区作品">
            {galleryImages.map((item) => {
              const asset = item.generatedImage.thumbnailAsset || item.generatedImage.outputAsset;
              const url = imageUrls.get(asset.id);
              const authorName = item.userProfile.username || item.userProfile.user?.name || "创作者";

              return (
                <article key={item.id} className={styles.gallery__card}>
                  {url ? (
                    <Image
                      className={styles.gallery__image}
                      src={url}
                      alt={item.title || item.prompt}
                      width={item.generatedImage.width || asset.width || 768}
                      height={item.generatedImage.height || asset.height || 768}
                      unoptimized
                    />
                  ) : null}

                  <div className={styles.gallery__cardBody}>
                    <div className={styles.gallery__cardMeta}>
                      <span>{categoryLabels[item.category]}</span>
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
        ) : (
          <section className={styles.gallery__empty}>
            <p className={styles.gallery__emptyLabel}>暂无公开作品</p>
            <h2 className={styles.gallery__emptyTitle}>第一批社区作品，等你发布。</h2>
            <p className={styles.gallery__emptyText}>
              完成生成后，在创作历史里选择作品并点击“发布到画廊”，它就会出现在这里。
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
