import clsx from "clsx";
import type { Metadata } from "next";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { requestJava } from "@/server/java-api";
import { getRegisterConfig } from "@/server/register-config";
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

const freeFeatureKeys = ["start", "learn", "browse", "noSubscription"] as const;

export default async function PricingPage() {
  const [packages, registerConfig] = await Promise.all([
    requestJava<CreditPackage[]>("/order/user/packages"),
    getRegisterConfig(),
  ]);
  const t = await getTranslations("pricing");
  const tActions = await getTranslations("common.actions");
  const rewardPoints = registerConfig.rewardPoints;
  const format = await getFormatter();
  return (
    <>
      <ProductTopNav />
      <main className={styles.pricing}>
        <section className={styles.pricing__hero}>
          <div className={styles.pricing__inner}>
            <div className={styles.pricing__header}>
              <h1 className="page-title">{t("title")}</h1>
            </div>

            <div className={styles.pricing__grid}>
              <article className={styles.pricing__card}>
                <p className={styles.pricing__code}>{t("free.code")}</p>
                <h2 className={styles.pricing__planName}>{t("free.name")}</h2>
                <div className={styles.pricing__priceRow}>
                  <p className={styles.pricing__price}>{format.number(0, "currency")}</p>
                  <p className={styles.pricing__credits}>
                    {rewardPoints > 0
                      ? t("free.creditsReward", { points: rewardPoints })
                      : t("free.credits")}
                  </p>
                </div>
                <ul className={styles.pricing__features}>
                  {freeFeatureKeys.map((key) => (
                    <li key={key} className={styles.pricing__feature}>
                      <span className={styles.pricing__featureDot} />
                      <span>{t(`free.features.${key}`)}</span>
                    </li>
                  ))}
                </ul>
                {registerConfig.registrationEnabled ? (
                  <Link href="/register" className={styles.pricing__action}>
                    {t("free.action")}
                  </Link>
                ) : (
                  <Link href="/login" className={styles.pricing__action}>
                    {tActions("login")}
                  </Link>
                )}
              </article>

              {packages.map((item) => {
                const highlighted = item.recommended;
                const badge = highlighted ? t("popular") : "";

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
                    <div className={styles.pricing__priceRow}>
                      <p className={styles.pricing__price}>
                        {format.number(item.amountCent / 100, "currency")}
                      </p>
                      <p
                        className={clsx(
                          styles.pricing__credits,
                          highlighted && styles.pricing__creditsHighlighted,
                        )}
                      >
                        {t("points", { points: item.credits })}
                      </p>
                    </div>
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
                      {t("buy")}
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
