import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import {
  landingAdvantages,
  landingFeatures,
  landingStats,
  landingSteps,
} from "@/constants/landing";
import styles from "./landing-page.module.css";

export function LandingPage() {
  return (
    <div className={styles.landing}>
      <ProductTopNav />

      <main>
        <section className={styles.landing__hero}>
          <div className={styles.landing__heroInner}>
            <h1 className={styles.landing__heroTitle}>
              一念之间，万象生成
            </h1>
            <p className={styles.landing__heroText}>
              输入一句描述，让 AI 创造独一无二的视觉作品。
            </p>

            <div className={styles.landing__heroActions}>
              <Link className="btn-primary" href="/generate">
                开始创作
                <ArrowRight size={16} />
              </Link>
              <Link className="btn-secondary" href="/login">
                登录
              </Link>
            </div>

            <div className={styles.landing__statsWrap}>
              <p className={styles.landing__statsTitle}>深受全球创作者喜爱</p>
              <div className={styles.landing__stats}>
                {landingStats.map((item) => (
                  <div key={item.label}>
                    <p className={styles.landing__statValue}>{item.value}</p>
                    <p className={styles.landing__statLabel}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.landing__section}>
          <div className={styles.landing__sectionInner}>
            <div className={styles.landing__sectionHeader}>
              <p className={styles.landing__eyebrow}>核心功能</p>
              <h2 className={styles.landing__sectionTitle}>创作所需，一应俱全</h2>
              <p className={styles.landing__sectionText}>从一句提示词到一组可用图片，把灵感、风格、参考图和成品管理放在一个地方。</p>
            </div>

            <div className={styles.landing__featureGrid}>
              {landingFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className={styles.landing__featureCard}>
                    <div className={styles.landing__featureIcon}>
                      <Icon size={20} />
                    </div>
                    <h3 className={styles.landing__cardTitle}>{feature.title}</h3>
                    <p className={styles.landing__cardText}>{feature.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.landing__sectionMuted}>
          <div className={styles.landing__sectionInner}>
            <div className={styles.landing__sectionHeader}>
              <p className={styles.landing__eyebrow}>使用流程</p>
              <h2 className={styles.landing__sectionTitle}>
                从想法到图片，四步搞定
              </h2>
              <p className={styles.landing__sectionText}>
                无需设计经验，也无需提示词技巧，几分钟即可开始创作。
              </p>
            </div>

            <div className={styles.landing__flow}>
              <span className={styles.landing__flowLine} aria-hidden="true" />
              {landingSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className={styles.landing__flowItem}>
                    <div className={styles.landing__flowIcon}>
                      <Icon size={30} strokeWidth={2.2} />
                    </div>
                    <div className={styles.landing__flowContent}>
                      <p className={styles.landing__flowNumber}>
                        Step {String(index + 1).padStart(2, "0")}
                      </p>
                      <h3 className={styles.landing__flowTitle}>
                        {step.title}
                      </h3>
                      <p className={styles.landing__flowText}>{step.text}</p>
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
              <p className={styles.landing__eyebrow}>创作优势</p>
              <h2 className={styles.landing__sectionTitle}>让灵感更快抵达画面</h2>
              <p className={styles.landing__sectionText}>
                适用广，应用于商品展示、社媒配图、头像角色、海报封面和插画草图等场景。
              </p>
              <div className={styles.landing__advantageList}>
                {landingAdvantages.map((item) => (
                  <div key={item} className={styles.landing__advantageItem}>
                    <Sparkles className={styles.landing__advantageIcon} size={16} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <div className={styles.landing__vision}>
                <p className={styles.landing__eyebrow}>推广目标</p>
                <h3 className={styles.landing__visionTitle}>
                  创作不再受限于工具
                </h3>
                <p className={styles.landing__visionText}>
                  我们致力于把 AI 图像、视频创作推广到全球，让更多人把灵感带到真实生活与工作场景中。
                </p>
                <div className={styles.landing__visionArtwork}>
                  <Image
                    src="/assets/creative.png"
                    alt="ZroImg 创作推广目标示意图"
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
                  ZroImg
                </Link>
              </div>

              <div>
                <h2 className={styles.landing__footerTitle}>产品</h2>
                <div className={styles.landing__footerLinks}>
                  <Link href="/pricing" className={styles.landing__footerLink}>
                    定价
                  </Link>
                  <Link href="/credits" className={styles.landing__footerLink}>
                    积分购买
                  </Link>
                  <Link href="mailto:support@zrocodeimg.com" className={styles.landing__footerLink}>
                    联系我们
                  </Link>
                </div>
              </div>

              <div>
                <h2 className={styles.landing__footerTitle}>法律</h2>
                <div className={styles.landing__footerLinks}>
                  <Link href="/terms" className={styles.landing__footerLink}>
                    服务条款
                  </Link>
                  <Link href="/privacy" className={styles.landing__footerLink}>
                    隐私政策
                  </Link>
                  <Link href="/cookies" className={styles.landing__footerLink}>
                    Cookie 政策
                  </Link>
                </div>
              </div>
            </div>

            <div className={styles.landing__copyright}>
              © 2026 ZroImg
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
