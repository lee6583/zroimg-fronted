"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { usePathname } from "next/navigation";
import {
  Clock3,
  Clapperboard,
  Coins,
  FolderHeart,
  Frame,
  ImagePlus,
  LayoutDashboard,
  PencilLine,
  ReceiptText,
  Send,
  Settings,
  FolderOpen,
  LifeBuoy,
  Sparkles,
  Wallet,
} from "lucide-react";
import { SideNav, type NavGroup, type NavItem } from "./side-nav";
import styles from "./shell.module.css";

type AppSection =
  | "overview"
  | "generate"
  | "canvas"
  | "video"
  | "history"
  | "favorites"
  | "submissions"
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

const overviewItems: Array<NavItem<AppSection>> = [
  {
    key: "overview",
    label: "概览",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
];

const appNavGroups: Array<NavGroup<AppSection>> = [
  {
    key: "create",
    label: "创作中心",
    icon: Sparkles,
    items: [
      {
        key: "generate",
        label: "图片生成",
        href: "/generate",
        icon: ImagePlus,
      },
      {
        key: "canvas",
        label: "无限画布",
        href: "/canvas",
        icon: Frame,
      },
      {
        key: "video",
        label: "视频创作",
        href: "/video",
        icon: Clapperboard,
      },
    ],
  },
  {
    key: "content",
    label: "内容管理",
    icon: FolderOpen,
    items: [
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
        key: "submissions",
        label: "我的投稿",
        href: "/submissions",
        icon: Send,
      },
    ],
  },
  {
    key: "billing",
    label: "交易与资产",
    icon: Wallet,
    items: [
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
    ],
  },
  {
    key: "help",
    label: "帮助与设置",
    icon: LifeBuoy,
    items: [
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
    ],
  },
];

function getActiveSection(pathname: string): AppSection {
  if (pathname.startsWith("/generate")) return "generate";
  if (pathname.startsWith("/canvas")) return "canvas";
  if (pathname.startsWith("/video")) return "video";
  if (pathname.startsWith("/history")) return "history";
  if (pathname.startsWith("/favorites")) return "favorites";
  if (pathname.startsWith("/submissions")) return "submissions";
  if (pathname.startsWith("/credits")) return "credits";
  if (pathname.startsWith("/billing")) return "billing";
  if (pathname.startsWith("/tickets")) return "tickets";
  if (pathname.startsWith("/settings")) return "settings";

  return "overview";
}

function getFlush(pathname: string) {
  const isEditor = pathname.startsWith("/canvas/");
  return pathname.startsWith("/generate") || pathname.startsWith("/video") || isEditor;
}

export function ProductFrame(props: ProductFrameProps) {
  const children = props.children;
  const topNav = props.topNav;
  const pathname = usePathname();
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
              <SideNav
                storageKey="zroimg.nav.user"
                items={overviewItems}
                groups={appNavGroups}
                activeKey={visibleActive}
                onNavigate={(item) => setPendingNav({ href: item.href, key: item.key })}
              />
            </div>
          </aside>

          <main className={mainClass}>{children}</main>
        </div>
      </div>
    </div>
  );
}
