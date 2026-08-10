"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import clsx from "clsx";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

type ProductFrameProps = {
  children: ReactNode;
  topNav: ReactNode;
};

type PendingNav = {
  href: string;
  key: AppSection;
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

function getActiveSection(pathname: string): AppSection {
  if (pathname.startsWith("/generate")) return "generate";
  if (pathname.startsWith("/video")) return "video";
  if (pathname.startsWith("/history")) return "history";
  if (pathname.startsWith("/favorites")) return "favorites";
  if (pathname.startsWith("/credits")) return "credits";
  if (pathname.startsWith("/billing")) return "billing";
  if (pathname.startsWith("/tickets")) return "tickets";
  if (pathname.startsWith("/settings")) return "settings";

  return "overview";
}

function getFlush(pathname: string) {
  return pathname.startsWith("/generate") || pathname.startsWith("/video");
}

export function ProductFrame(props: ProductFrameProps) {
  const children = props.children;
  const topNav = props.topNav;
  const pathname = usePathname();
  const router = useRouter();
  const active = useMemo(() => getActiveSection(pathname), [pathname]);
  const flush = useMemo(() => getFlush(pathname), [pathname]);
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);

  const isPendingCurrent =
    pendingNav !== null &&
    (pathname === pendingNav.href || pathname.startsWith(`${pendingNav.href}/`));
  const visibleActive = pendingNav && !isPendingCurrent ? pendingNav.key : active;
  let mainClass = styles.shell__main;
  if (flush) {
    mainClass = styles.shell__mainFlush;
  }

  return (
    <div className={clsx(styles.shellPage, flush && styles.shellPageFlush)}>
      {topNav}
      <div className={clsx(styles.shell, flush && styles.shellFlush)}>
        <div className={clsx(styles.shell__grid, flush && styles.shell__gridFlush)}>
          <aside className={styles.shell__sidebar}>
            <div className={styles.shell__sidebarInner}>
              <nav className={styles.shell__nav}>
                {appNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = visibleActive === item.key;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      prefetch
                      onFocus={() => router.prefetch(item.href)}
                      onMouseEnter={() => router.prefetch(item.href)}
                      onClick={() => setPendingNav({ href: item.href, key: item.key })}
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
    </div>
  );
}
