import Link from "next/link";
import {
  ArrowRight,
  Coins,
  Download,
  ImagePlus,
  Layers,
  MessageSquare,
  Palette,
  Settings,
  Sparkles,
} from "lucide-react";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import styles from "./landing-page.module.css";

const stats = [
  { value: "10K+", label: "已生成图片" },
  { value: "500+", label: "活跃用户" },
  { value: "95%", label: "满意度" },
];

const features = [
  {
    icon: MessageSquare,
    title: "对话式创作",
    text: "像聊天一样描述画面，人物、场景、光线、风格，都可以用一句话慢慢调整。",
  },
  {
    icon: Palette,
    title: "多种风格",
    text: "写实、动漫、水彩、油画、极简海报、商品视觉，为不同场景快速找到合适气质。",
  },
  {
    icon: Layers,
    title: "批量探索",
    text: "一次生成多张变体，适合探索方向、挑选构图，也适合把灵感快速铺开。",
  },
  {
    icon: ImagePlus,
    title: "参考图再创作",
    text: "上传参考图，保留主体、替换背景、调整风格，让旧素材长出新的可能。",
  },
  {
    icon: Download,
    title: "高清输出",
    text: "适合头像、封面、海报、商品图和社媒配图，让作品能直接进入使用场景。",
  },
  {
    icon: Coins,
    title: "灵活积分",
    text: "按需购买积分，用多少生成多少；适合轻量尝试，也适合持续创作。",
  },
];

const steps = [
  {
    icon: Settings,
    title: "注册账号",
    text: "几秒钟即可免费注册，无需信用卡。注册后立即获得积分。",
  },
  {
    icon: MessageSquare,
    title: "描述你的构想",
    text: "开启对话，描述你想要的画面。持续迭代，直到触动你的灵感。",
  },
  {
    icon: Sparkles,
    title: "AI 生成作品",
    text: "AI 解读你的提示词，数秒内产出高质量图像。生成多个变体探索方向。",
  },
  {
    icon: Download,
    title: "下载分享",
    text: "将作品高清下载或直接分享。所有图片都保留在画廊中，随时回看。",
  },
];

const advantages = [
  "不需要会画画，也能把脑海里的构图讲清楚。",
  "从头像、商品图到海报封面，都能快速探索方向。",
  "每一次生成都会留下记录，满意的图可以继续编辑。",
  "积分按需购买，适合偶尔创作，也适合长期产出。",
];

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
                {stats.map((item) => (
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
              {features.map((feature) => {
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
              {steps.map((step, index) => {
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
                {advantages.map((item) => (
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
