import Link from "next/link";
import { AccountMenu } from "@/components/layout/account-menu";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeControls } from "@/components/layout/theme-controls";
import { getCurrentUserProfile } from "@/server/auth";
import styles from "./product-top-nav.module.css";

const publicCenterLinks = [
  { label: "创作图片", href: "/generate" },
  { label: "作品画廊", href: "/gallery" },
  { label: "定价", href: "/pricing" },
  { label: "文档", href: "/docs" },
];

const appCenterLinks = publicCenterLinks;
const adminCenterLinks: typeof publicCenterLinks = [];

function avatarLabel(name?: string | null) {
  return (name || "Z").trim().slice(0, 1).toUpperCase();
}

export async function ProductTopNav() {
  const current = await getCurrentUserProfile();
  let centerLinks = publicCenterLinks;
  if (current) {
    centerLinks = appCenterLinks;
  }
  if (current?.profile.role === "admin") {
    centerLinks = adminCenterLinks;
  }

  return (
    <header className={styles.productTopNav}>
      <div className={styles.productTopNav__inner}>
        <BrandLogo />

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
