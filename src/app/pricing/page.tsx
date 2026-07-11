import clsx from "clsx";
import Link from "next/link";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import { prisma } from "@/server/bff/orders";
import styles from "./pricing.module.css";

export const dynamic = "force-dynamic";

const packageCopy: Record<
  string,
  {
    name: string;
    line: string;
    badge?: string;
    features: string[];
  }
> = {
  STARTER_100: {
    name: "轻量试创",
    line: "把脑海里的第一束光，先变成看得见的画面。",
    features: [
      "100 积分，即买即用",
      "适合头像、封面与灵感草稿",
      "支持文本生图与图生图",
      "订单与积分流水清晰可查",
    ],
  },
  PRO_500: {
    name: "创作者",
    line: "为持续创作留出余量，让好想法不必停在半路。",
    badge: "最受欢迎",
    features: [
      "500 积分，适合日常高频创作",
      "覆盖主流图片生成与编辑场景",
      "适合社媒配图、海报与产品概念",
      "失败任务自动返还本次消耗",
    ],
  },
  MAX_1200: {
    name: "灵感工作室",
    line: "给完整项目一整片画布，从概念到成片都从容推进。",
    features: [
      "1200 积分，适合项目制创作",
      "更适合多版本探索与精修",
      "适合品牌视觉、系列图与素材库",
      "购买记录可在我的订单中查看",
    ],
  },
};

const freeFeatures = [
  "注册后即可开始体验",
  "适合熟悉提示词与工作流",
  "可浏览作品与创作入口",
  "不需要订阅，想用时再补充",
];

export default async function PricingPage() {
  const packages = await prisma.creditPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return (
    <>
      <ProductTopNav />
      <main className={styles.pricing}>
        <section className={styles.pricing__hero}>
          <div className={styles.pricing__inner}>
            <div className={styles.pricing__header}>
              <p className={styles.pricing__eyebrow}>PRICING</p>
              <h1 className={styles.pricing__title}>选择适合你的创作方案</h1>
              <p className={styles.pricing__description}>
                灵活积分，按需购买。灵感落笔之处，皆可成像；一念之间，万象生成。
              </p>
            </div>

            <div className={styles.pricing__grid}>
              <article className={styles.pricing__card}>
                <p className={styles.pricing__code}>Free</p>
                <h2 className={styles.pricing__planName}>免费体验</h2>
                <p className={styles.pricing__planLine}>先试试看，让第一张图替你打开想象力。</p>
                <p className={styles.pricing__price}>¥0</p>
                <p className={styles.pricing__credits}>新用户体验额度</p>
                <ul className={styles.pricing__features}>
                  {freeFeatures.map((feature) => (
                    <li key={feature} className={styles.pricing__feature}>
                      <span className={styles.pricing__featureDot} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={styles.pricing__action}>
                  注册体验
                </Link>
              </article>

              {packages.map((item) => {
                const copy = packageCopy[item.code] ?? {
                  name: item.name,
                  line: "为下一次创作补充能量，让想法继续向前。",
                  features: [
                    `${item.credits} 积分，即买即用`,
                    "支持图片生成与编辑",
                    "适合按需补充创作额度",
                    "购买记录可在我的订单中查看",
                  ],
                };
                const highlighted = Boolean(copy.badge);

                return (
                  <article
                    key={item.id}
                    className={clsx(
                      styles.pricing__card,
                      highlighted && styles.pricing__cardHighlighted,
                    )}
                  >
                    {copy.badge ? (
                      <span className={styles.pricing__badge}>{copy.badge}</span>
                    ) : null}
                    <p className={styles.pricing__code}>{item.code}</p>
                    <h2 className={styles.pricing__planName}>{copy.name}</h2>
                    <p
                      className={clsx(
                        styles.pricing__planLine,
                        highlighted && styles.pricing__planLineHighlighted,
                      )}
                    >
                      {copy.line}
                    </p>
                    <p className={styles.pricing__price}>¥{item.priceCny.toString()}</p>
                    <p
                      className={clsx(
                        styles.pricing__credits,
                        highlighted && styles.pricing__creditsHighlighted,
                      )}
                    >
                      {item.credits} 积分
                    </p>
                    <ul
                      className={clsx(
                        styles.pricing__features,
                        highlighted && styles.pricing__featuresHighlighted,
                      )}
                    >
                      {copy.features.map((feature) => (
                        <li key={feature} className={styles.pricing__feature}>
                          <span
                            className={clsx(
                              styles.pricing__featureDot,
                              highlighted && styles.pricing__featureDotHighlighted,
                            )}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href="/credits"
                      className={clsx(
                        styles.pricing__action,
                        highlighted && styles.pricing__actionHighlighted,
                      )}
                    >
                      立即购买
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
