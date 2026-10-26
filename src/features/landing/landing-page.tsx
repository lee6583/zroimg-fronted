import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import {
  landingAdvantages,
  landingFeatures,
  landingStats,
  landingSteps,
} from "@/constants/landing";
import { Link } from "@/i18n/navigation";
import { siteName } from "@/lib/seo";
import styles from "./landing-page.module.css";

// 版权年份是静态内容，避免在渲染期间调用 Date；传字符串避免 ICU 按数字格式化成 "2,026"。
const copyrightYear = 2026;

export async function LandingPage() {
  const t = await getTranslations("landing");
  const tActions = await getTranslations("common.actions");

  return (
    <div className={styles.landing}>
      <ProductTopNav />

      <main>
        <section className={styles.landing__hero}>
          <div className={styles.landing__heroInner}>
            <h1 className={styles.landing__heroTitle}>{t("hero.title")}</h1>
            <p className={styles.landing__heroText}>{t("hero.text")}</p>

            <div className={styles.landing__heroActions}>
              <Link className="btn-primary" href="/generate">
                {tActions("startCreating")}
                <ArrowRight size={16} />
              </Link>
              <Link className="btn-secondary" href="/login">
                {tActions("login")}
              </Link>
            </div>

            <div className={styles.landing__statsWrap}>
              <p className={styles.landing__statsTitle}>{t("hero.statsTitle")}</p>
              <div className={styles.landing__stats}>
                {landingStats.map((item) => (
                  <div key={item.key}>
                    <p className={styles.landing__statValue}>{item.value}</p>
                    <p className={styles.landing__statLabel}>{t(`stats.${item.key}`)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.landing__section}>
          <div className={styles.landing__sectionInner}>
            <div className={styles.landing__sectionHeader}>
              <p className={styles.landing__eyebrow}>{t("features.eyebrow")}</p>
              <h2 className={styles.landing__sectionTitle}>{t("features.title")}</h2>
              <p className={styles.landing__sectionText}>{t("features.text")}</p>
            </div>

            <div className={styles.landing__featureGrid}>
              {landingFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.key} className={styles.landing__featureCard}>
                    <div className={styles.landing__featureIcon}>
                      <Icon size={20} />
                    </div>
                    <h3 className={styles.landing__cardTitle}>
                      {t(`features.items.${feature.key}.title`)}
                    </h3>
                    <p className={styles.landing__cardText}>
                      {t(`features.items.${feature.key}.text`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.landing__sectionMuted}>
          <div className={styles.landing__sectionInner}>
            <div className={styles.landing__sectionHeader}>
              <p className={styles.landing__eyebrow}>{t("steps.eyebrow")}</p>
              <h2 className={styles.landing__sectionTitle}>{t("steps.title")}</h2>
              <p className={styles.landing__sectionText}>{t("steps.text")}</p>
            </div>

            <div className={styles.landing__flow}>
              <span className={styles.landing__flowLine} aria-hidden="true" />
              {landingSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.key} className={styles.landing__flowItem}>
                    <div className={styles.landing__flowIcon}>
                      <Icon size={30} strokeWidth={2.2} />
                    </div>
                    <div className={styles.landing__flowContent}>
                      <p className={styles.landing__flowNumber}>
                        {t("steps.number", { number: String(index + 1).padStart(2, "0") })}
                      </p>
                      <h3 className={styles.landing__flowTitle}>
                        {t(`steps.items.${step.key}.title`)}
                      </h3>
                      <p className={styles.landing__flowText}>
                        {t(`steps.items.${step.key}.text`)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="advantages" className={styles.landing__section}>
          <div className={styles.landing__advantages}>
            <div className={styles.landing__advantagesContent}>
              <p className={styles.landing__eyebrow}>{t("advantages.eyebrow")}</p>
              <h2 className={styles.landing__sectionTitle}>{t("advantages.title")}</h2>
              <p className={styles.landing__sectionText}>{t("advantages.text")}</p>
              <div className={styles.landing__advantageList}>
                {landingAdvantages.map((item) => (
                  <div key={item} className={styles.landing__advantageItem}>
                    <Sparkles className={styles.landing__advantageIcon} size={16} />
                    <span>{t(`advantages.items.${item}`)}</span>
                  </div>
                ))}
              </div>
              <div className={styles.landing__vision}>
                <p className={styles.landing__eyebrow}>{t("vision.eyebrow")}</p>
                <h3 className={styles.landing__visionTitle}>{t("vision.title")}</h3>
                <p className={styles.landing__visionText}>{t("vision.text")}</p>
                <div className={styles.landing__visionArtwork}>
                  <Image
                    src="/assets/creative.png"
                    alt={t("vision.imageAlt")}
                    width={1699}
                    height={926}
                    sizes="(max-width: 768px) calc(100vw - 2rem), 960px"
                    className={styles.landing__visionImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className={styles.landing__footer}>
          <div className={styles.landing__footerInner}>
            <div className={styles.landing__footerGrid}>
              <div>
                <Link href="/" className={styles.landing__brand}>
                  {siteName}
                </Link>
              </div>

              <div>
                <h2 className={styles.landing__footerTitle}>{t("footer.product")}</h2>
                <div className={styles.landing__footerLinks}>
                  <Link href="/pricing" className={styles.landing__footerLink}>
                    {t("footer.pricing")}
                  </Link>
                  <Link href="/credits" className={styles.landing__footerLink}>
                    {t("footer.credits")}
                  </Link>
                  <Link href="mailto:support@zrocodeimg.com" className={styles.landing__footerLink}>
                    {t("footer.contact")}
                  </Link>
                </div>
              </div>

              <div>
                <h2 className={styles.landing__footerTitle}>{t("footer.legal")}</h2>
                <div className={styles.landing__footerLinks}>
                  <Link href="/terms" className={styles.landing__footerLink}>
                    {t("footer.terms")}
                  </Link>
                  <Link href="/privacy" className={styles.landing__footerLink}>
                    {t("footer.privacy")}
                  </Link>
                  <Link href="/cookies" className={styles.landing__footerLink}>
                    {t("footer.cookies")}
                  </Link>
                  <Link href="/licenses" className={styles.landing__footerLink}>
                    {t("footer.licenses")}
                  </Link>
                </div>
              </div>
            </div>

            <div className={styles.landing__copyright}>
              {t("footer.copyright", { year: String(copyrightYear) })}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
