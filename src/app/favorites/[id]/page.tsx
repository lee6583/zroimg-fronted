import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ImageOff } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth";
import { getCollection } from "@/server/bff/account";
import { getMediaSignedUrl } from "@/server/bff/generation";
import styles from "../favorites.module.css";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ id: string }>;
type FavoriteCollectionPageProps = {
  params: PageParams;
};

type CollectionItem = NonNullable<Awaited<ReturnType<typeof getCollection>>>["items"][number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export default async function FavoriteCollectionPage(props: FavoriteCollectionPageProps) {
  const params = props.params;

  const current = await requireUser();
  const { id } = await params;
  const collection = await getCollection(current.profile.id, id);

  if (!collection) notFound();

  const imageUrls = new Map<string, string>();

  for (const item of collection.items) {
    const image = item.generatedImage;
    const asset = image.thumbnailAsset || image.outputAsset;
    imageUrls.set(asset.id, await getMediaSignedUrl(asset.id));
  }

  return (
    <AppShell active="favorites">
      <main className={styles.favorites}>
        <section className={styles.favorites__detailHeader}>
          <Link href="/favorites" className={styles.favorites__backLink}>
            <ArrowLeft size={15} />
            返回合集
          </Link>
          <h1 className={styles.favorites__detailTitle}>{collection.name}</h1>
          <p className={styles.favorites__description}>{collection._count.items} 张图片</p>
        </section>

        {collection.items.length > 0 ? (
          <section className={styles.favorites__imageGrid} aria-label="合集图片">
            {collection.items.map((item: CollectionItem) => {
              const image = item.generatedImage;
              const asset = image.thumbnailAsset || image.outputAsset;
              const url = imageUrls.get(asset.id);

              return (
                <article key={item.id} className={styles.favorites__imageCard}>
                  {url ? (
                    <Image
                      className={styles.favorites__image}
                      src={url}
                      alt={image.task.prompt}
                      width={image.width || asset.width || 768}
                      height={image.height || asset.height || 768}
                      unoptimized
                    />
                  ) : (
                    <div className={styles.favorites__imagePlaceholder}>
                      <ImageOff size={22} />
                    </div>
                  )}
                  <div className={styles.favorites__imageBody}>
                    <p className={styles.favorites__imagePrompt}>{image.task.prompt}</p>
                    <p className={styles.favorites__imageMeta}>{formatDate(item.createdAt)}</p>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className={styles.favorites__detailEmpty}>
            <span className={styles.favorites__cardIcon}>
              <ImageOff size={23} />
            </span>
            <h2 className={styles.favorites__detailEmptyTitle}>这个合集还没有图片</h2>
            <p className={styles.favorites__cardMeta}>后续可以从创作历史里把喜欢的作品加入这里。</p>
          </section>
        )}
      </main>
    </AppShell>
  );
}
