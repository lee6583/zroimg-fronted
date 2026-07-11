import type { ReactNode } from "react";
import clsx from "clsx";
import Link from "next/link";
import {
  BookMarked,
  Clock3,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  ReceiptText,
  Settings,
} from "lucide-react";
import { ProductTopNav } from "@/components/layout/product-top-nav";
import styles from "./shell.module.css";

type AppSection =
  "overview" | "history" | "favorites" | "credits" | "billing" | "tickets" | "settings";

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
    key: "history",
    label: "创作历史",
    href: "/history",
    icon: Clock3,
  },
  {
    key: "favorites",
    label: "收藏合集",
    href: "/favorites",
    icon: BookMarked,
  },
  {
    key: "credits",
    label: "积分购买",
    href: "/credits",
    icon: CreditCard,
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
    icon: LifeBuoy,
  },
  {
    key: "settings",
    label: "账户设置",
    href: "/settings",
    icon: Settings,
  },
];

export async function AppShell({
  active,
  children,
  flush = false,
}: {
  active?: AppSection;
  children: ReactNode;
  flush?: boolean;
}) {
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
