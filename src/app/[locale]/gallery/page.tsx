import clsx from "clsx";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { GalleryFeed } from "@/features/gallery/gallery-feed";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { imageGallery } from "@/lib/structured-data";
import { getCurrentUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { GalleryCategoryOption, GalleryCursorPage, GalleryImage } from "@/types/gallery";
import { parseJavaDateTime } from "@/utils/java-time";
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

type GalleryPageProps = {
  searchParams: Promise<{
    category?: string | string[];
    image?: string | string[];
  }>;
};

const firstPageSize = 24;

// 分享链接里的作品可能已下架或 ID 不合法：此时只是不打开详情，不让整页报错
async function loadDetail(imageId: string | undefined) {
  if (!imageId || !/^\d+$/.test(imageId)) {
    return null;
  }

  try {
    return await requestJava<GalleryImage>(`/gallery/public/images/${imageId}`);
  } catch {
    return null;
  }
}

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default async function GalleryPage(props: GalleryPageProps) {
  const params = await props.searchParams;
  const rawCategory = readParam(params.category);
  const imageId = readParam(params.image);

  // 第一步：分类来自后台配置；地址里的分类不存在或已停用时按“全部”处理
  const categories = await requestJava<GalleryCategoryOption[]>("/gallery/public/categories");
  let category: string | undefined;
  if (rawCategory && categories.some((item) => item.code === rawCategory)) {
    category = rawCategory;
  }

  // 第二步：首屏数据服务端渲染（利于收录），之后的分页由客户端按游标加载
  const [firstPage, detail, user] = await Promise.all([
    requestJava<GalleryCursorPage<GalleryImage>>("/gallery/public/images", {
      params: { category, limit: firstPageSize },
    }),
    loadDetail(imageId),
    getCurrentUser(),
  ]);

  const locale = await getLocale();
  const tMeta = await getTranslations("metadata.gallery");
  const t = await getTranslations("gallery");
  const tCommon = await getTranslations("common");

  const galleryItems = firstPage.items.map((item) => {
    const authorName = item.userProfile.username || item.userProfile.user?.name || undefined;

    return {
      imageUrl: item.generatedImage.imageUrl,
      name: item.title || item.prompt,
      description: item.prompt,
      authorName,
      datePublished: parseJavaDateTime(item.reviewTime || item.createdAt).toISOString(),
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
        <header className={styles.gallery__header}>
          <h1 className={styles.gallery__title}>{t("hero.title")}</h1>
          <p className={styles.gallery__subtitle}>{t("hero.subtitle")}</p>
        </header>

        <nav className={styles.gallery__tabs} aria-label={t("tabs.label")}>
          <Link
            href="/gallery"
            className={clsx(styles.gallery__tab, !category && styles.gallery__tabActive)}
            aria-current={!category ? "page" : undefined}
          >
            {t("tabs.all")}
          </Link>
          {categories.map((tab) => {
            const isActive = category === tab.code;
            return (
              <Link
                key={tab.code}
                href={{ pathname: "/gallery", query: { category: tab.code } }}
                className={clsx(styles.gallery__tab, isActive && styles.gallery__tabActive)}
                aria-current={isActive ? "page" : undefined}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>

        {firstPage.items.length > 0 || detail ? (
          <GalleryFeed
            key={category || "all"}
            category={category}
            initialPage={firstPage}
            initialDetail={detail}
            isLoggedIn={Boolean(user)}
            isAdmin={user?.role === "admin"}
          />
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
