import Link from "next/link";
import { AccountMenu } from "@/components/layout/account-menu";
import { ThemeControls } from "@/components/layout/theme-controls";
import { getCurrentUserProfile } from "@/server/auth";
import styles from "./product-top-nav.module.css";

const publicCenterLinks = [
  { label: "开始创作", href: "/generate" },
  { label: "作品画廊", href: "/gallery" },
  { label: "定价", href: "/pricing" },
  { label: "文档", href: "/docs" },
  { label: "创作优势", href: "/#advantages" },
];

const appCenterLinks = publicCenterLinks.filter((item) => item.label !== "创作优势");
const adminCenterLink = { label: "管理", href: "/admin" };

function avatarLabel(name?: string | null) {
  return (name || "Z").trim().slice(0, 1).toUpperCase();
}

export async function ProductTopNav() {
  const current = await getCurrentUserProfile();
  const centerLinks = current ? (current.profile.role === "admin" ? [...appCenterLinks, adminCenterLink] : appCenterLinks) : publicCenterLinks;

  return (
    <header className={styles.productTopNav}>
      <div className={styles.productTopNav__inner}>
        <Link href="/" className={styles.productTopNav__brand}>
          <span className={styles.productTopNav__brandText}>ZroCodeImg</span>
        </Link>

        <nav className={styles.productTopNav__center}>
          {centerLinks.map((item) => (
            <Link key={item.href} href={item.href} className={styles.productTopNav__link}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.productTopNav__actions}>
          <ThemeControls />
          {current ? (
            <AccountMenu label={avatarLabel(current.profile.username)} />
          ) : (
            <Link href="/login" className={styles.productTopNav__avatar} aria-label="登录">
              登录
            </Link>
          )}
        </div>
      </div>

      <nav className={styles.productTopNav__mobileNav}>
        {centerLinks.map((item) => (
          <Link key={item.href} href={item.href} className={styles.productTopNav__mobileLink}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
