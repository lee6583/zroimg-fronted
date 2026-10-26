import Image from "next/image";
import { ArrowLeft, ImageOff } from "lucide-react";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/auth";
import { JavaApiError, requestJava } from "@/server/java-api";
import type { FavoriteCollection } from "@/types/favorites";
import { userAssetUrl } from "@/utils/media";
import styles from "../favorites.module.css";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

type PageParams = Promise<{ id: string }>;
type FavoriteCollectionPageProps = {
  params: PageParams;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

async function readCollection(id: string) {
  try {
    return await requestJava<FavoriteCollection>(
      `/favorite/user/collections/${encodeURIComponent(id)}`,
    );
  } catch (error) {
    // Java 对不存在或不属于当前用户的合集返回 400「合集不存在」
    if (error instanceof JavaApiError && (error.status === 400 || error.status === 404)) {
      return null;
    }

    throw error;
  }
}

export default async function FavoriteCollectionPage(props: FavoriteCollectionPageProps) {
  const params = props.params;

  await requireUser();
  const { id } = await params;
  const collection = await readCollection(id);

  if (!collection) notFound();

  return (
    <main className={styles.favorites}>
      <section className={styles.favorites__detailHeader}>
        <Link href="/favorites" className={styles.favorites__backLink}>
          <ArrowLeft size={15} />
          返回合集
        </Link>
        <h1 className="page-title">{collection.name}</h1>
      </section>

      {collection.items.length > 0 ? (
        <section className={styles.favorites__imageGrid} aria-label="合集图片">
          {collection.items.map((item) => {
            const image = item.generatedImage;
            const asset = image.thumbnailAsset || image.outputAsset;

            return (
              <article key={item.id} className={styles.favorites__imageCard}>
                <Image
                  className={styles.favorites__image}
                  src={userAssetUrl(asset.id)}
                  alt={image.task.prompt}
                  width={image.width || asset.width || 768}
                  height={image.height || asset.height || 768}
                  unoptimized
                />
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
  );
}
