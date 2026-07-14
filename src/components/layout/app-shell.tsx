import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "next/link";
import {
  Clock3,
  Clapperboard,
  Coins,
  FolderHeart,
  ImagePlus,
  LayoutDashboard,
  PencilLine,
  ReceiptText,
  Settings,
} from "lucide-react";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import styles from "./shell.module.css";

type AppSection =
  | "overview"
  | "generate"
  | "video"
  | "history"
  | "favorites"
  | "credits"
  | "billing"
  | "tickets"
  | "settings";

type AppShellProps = {
  active?: AppSection;
  children: ReactNode;
  flush?: boolean;
};

const appNavItems: Array<{
  key: AppSection;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    key: "overview",
    label: "概览",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    key: "generate",
    label: "图片生成",
    href: "/generate",
    icon: ImagePlus,
  },
  {
    key: "video",
    label: "视频创作",
    href: "/video",
    icon: Clapperboard,
  },
  {
    key: "history",
    label: "创作历史",
    href: "/history",
    icon: Clock3,
  },
  {
    key: "favorites",
    label: "收藏合集",
    href: "/favorites",
    icon: FolderHeart,
  },
  {
    key: "credits",
    label: "积分购买",
    href: "/credits",
    icon: Coins,
  },
  {
    key: "billing",
    label: "我的订单",
    href: "/billing",
    icon: ReceiptText,
  },
  {
    key: "tickets",
    label: "意见反馈",
    href: "/tickets",
    icon: PencilLine,
  },
  {
    key: "settings",
    label: "账户设置",
    href: "/settings",
    icon: Settings,
  },
];

export async function AppShell(props: AppShellProps) {
  const active = props.active;
  const children = props.children;
  const flush = props.flush ?? false;

  let mainClass = styles.shell__main;
  if (flush) {
    mainClass = styles.shell__mainFlush;
  }

  return (
    <>
      <ProductTopNav />
      <div className={styles.shell}>
        <div className={styles.shell__grid}>
          <aside className={styles.shell__sidebar}>
            <div className={styles.shell__sidebarInner}>
              <nav className={styles.shell__nav}>
                {appNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={clsx(
                        styles.shell__navLink,
                        isActive && styles.shell__navLinkActive,
                      )}
                    >
                      <span
                        className={clsx(
                          styles.shell__navIcon,
                          isActive && styles.shell__navIconActive,
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <span className={styles.shell__navText}>
                        <span>{item.label}</span>
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          <main className={mainClass}>{children}</main>
        </div>
      </div>
    </>
  );
}
