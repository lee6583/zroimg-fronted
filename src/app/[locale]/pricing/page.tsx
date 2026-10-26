import clsx from "clsx";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { requestJava } from "@/server/java-api";
import type { CreditPackage } from "@/types/orders";
import styles from "./pricing.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata.pricing");

  return buildMetadata({
    locale,
    path: "/pricing",
    title: t("title"),
    description: t("description"),
  });
}

const freeFeatures = [
  "注册后即可开始体验",
  "适合熟悉提示词与工作流",
  "可浏览作品与创作入口",
  "不需要订阅，想用时再补充",
];

export default async function PricingPage() {
  const packages = await requestJava<CreditPackage[]>("/order/user/packages");
  return (
    <>
      <ProductTopNav />
      <main className={styles.pricing}>
        <section className={styles.pricing__hero}>
          <div className={styles.pricing__inner}>
            <div className={styles.pricing__header}>
              <h1 className="page-title">选择适合你的创作方案</h1>
            </div>

            <div className={styles.pricing__grid}>
              <article className={styles.pricing__card}>
                <p className={styles.pricing__code}>Free</p>
                <h2 className={styles.pricing__planName}>免费体验</h2>
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
                const highlighted = item.recommended;
                const badge = highlighted ? "最受欢迎" : "";

                return (
                  <article
                    key={item.id}
                    className={clsx(
                      styles.pricing__card,
                      highlighted && styles.pricing__cardHighlighted,
                    )}
                  >
                    {badge ? <span className={styles.pricing__badge}>{badge}</span> : null}
                    <p className={styles.pricing__code}>{item.code}</p>
                    <h2 className={styles.pricing__planName}>{item.name}</h2>
                    <p
                      className={clsx(
                        styles.pricing__planLine,
                        highlighted && styles.pricing__planLineHighlighted,
                      )}
                    >
                      {item.description}
                    </p>
                    <p className={styles.pricing__price}>{item.amountText}</p>
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
                      {item.highlights.map((feature) => (
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
