import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/layout/brand-logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeControls } from "@/components/layout/theme-controls";
import { noindexRobots } from "@/lib/seo";
import styles from "./auth-layout.module.css";

// 登录、注册、找回密码不进入搜索结果；页面各自用 buildMetadata({ noindex: true }) 输出标题。
export const metadata: Metadata = {
  robots: noindexRobots,
};

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout(props: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className={styles.authLayout__topbar}>
        <BrandLogo />
        <div className={styles.authLayout__actions}>
          <LocaleSwitcher />
          <ThemeControls />
        </div>
      </header>
      {props.children}
    </div>
  );
}
