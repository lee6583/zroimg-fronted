import Link from "next/link";
import { ArrowRight, Coins, Download, Heart, ImagePlus, Layers, MessageSquare, Palette, Sparkles } from "lucide-react";
import { ProductTopNav } from "@/components/product-top-nav";
import styles from "./landing-page.module.css";

const stats = [
  { value: "灵感落笔", label: "皆可成像" },
  { value: "一念之间", label: "万象生成" },
  { value: "旧图新绘", label: "再起风格" },
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
  { title: "写下灵感", text: "一句话描述你想看见的画面，也可以从参考图开始。" },
  { title: "选择方向", text: "选择尺寸、质量和张数，让画面贴近你的使用场景。" },
  { title: "生成变体", text: "一次获得多种可能，从里面挑出最接近想象的那一张。" },
  { title: "保存再创作", text: "生成结果会保留在历史中，方便下载、复用和继续编辑。" },
];

const inspirations = [
  "灵感落笔之处，皆可成像。",
  "一念之间，万象生成。",
  "让想象不止停在脑海里。",
  "把一句描述，变成一张可以使用的作品。",
];

const advantages = [
  "不需要会画画，也能把脑海里的构图讲清楚。",
  "从头像、商品图到海报封面，都能快速探索方向。",
  "每一次生成都会留下记录，满意的图可以继续编辑。",
  "积分按需购买，适合偶尔创作，也适合长期产出。",
];

const scenes = [
  "商品主图",
  "社媒封面",
  "头像与角色",
  "海报视觉",
  "插画草图",
];

export function LandingPage() {
  return (
    <div className={styles.landing}>
      <ProductTopNav />

      <main>
        <section className={styles.landing__hero}>
          <div className={styles.landing__heroInner}>
            <span className={styles.landing__pill}>
              灵感落笔之处，皆可成像
              <ArrowRight size={14} />
            </span>

            <h1 className={styles.landing__heroTitle}>
              一念之间，万象生成
            </h1>
            <p className={styles.landing__heroText}>
              说出你的画面，上传你的参考，让脑海里的光影、人物、商品和故事，变成真正可见、可下载、可继续创作的图片。
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

            <div className={styles.landing__stats}>
              {stats.map((item) => (
                <div key={item.label}>
                  <p className={styles.landing__statValue}>{item.value}</p>
                  <p className={styles.landing__statLabel}>{item.label}</p>
                </div>
              ))}
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
              <h2 className={styles.landing__sectionTitle}>从一句话到一张图</h2>
            </div>

            <div className={styles.landing__stepsGrid}>
              {steps.map((step, index) => (
                <div key={step.title} className={styles.landing__stepCard}>
                  <p className={styles.landing__stepNumber}>Step {String(index + 1).padStart(2, "0")}</p>
                  <h3 className={styles.landing__stepTitle}>{step.title}</h3>
                  <p className={styles.landing__cardText}>{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="advantages" className={styles.landing__section}>
          <div className={styles.landing__advantages}>
            <div>
              <p className={styles.landing__eyebrow}>创作优势</p>
              <h2 className={styles.landing__sectionTitle}>让灵感更快抵达画面</h2>
              <p className={styles.landing__advantageText}>
                不必从空白画布开始，也不必反复寻找素材。输入一句话，选择几张参考图，就能快速获得多个方向，再把满意的结果收藏、下载或继续编辑。
              </p>
              <div className={styles.landing__sceneTags}>
                {scenes.map((item) => (
                  <span key={item} className={styles.landing__sceneTag}>
                    {item}
                  </span>
                ))}
              </div>
              <div className={styles.landing__advantageList}>
                {advantages.map((item) => (
                  <div key={item} className={styles.landing__advantageItem}>
                    <Sparkles className={styles.landing__advantageIcon} size={16} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.landing__inspirationCard}>
              <div className={styles.landing__inspirationList}>
                {inspirations.map((item) => (
                  <div key={item} className={styles.landing__inspirationItem}>
                    <Heart size={16} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className={styles.landing__footer}>
          <div className={styles.landing__footerInner}>
            <div className={styles.landing__footerGrid}>
              <div>
                <Link href="/" className={styles.landing__brand}>
                  ZroCodeImg
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
                  <Link href="/#advantages" className={styles.landing__footerLink}>
                    创作优势
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
              © 2026 ZroCodeImg
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
