"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
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
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { MobileTabBar, type MobileAccount, type MobileTabKey } from "./mobile-tab-bar";
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
  account: MobileAccount;
};

type PendingNav = {
  href: string;
  key: AppSection;
};

type SidebarItemKey = Exclude<AppSection, "overview">;
type SidebarGroupKey = "create" | "content" | "billing" | "help";

type SidebarItemDef = {
  key: SidebarItemKey;
  href: string;
  icon: LucideIcon;
};

type SidebarGroupDef = {
  key: SidebarGroupKey;
  icon: LucideIcon;
  items: SidebarItemDef[];
};

// 只定义结构；显示文案来自 nav.sidebar.groups.* / nav.sidebar.items.*，key 与这里一一对应。
const sidebarGroups: SidebarGroupDef[] = [
  {
    key: "create",
    icon: Sparkles,
    items: [
      { key: "generate", href: "/generate", icon: ImagePlus },
      { key: "canvas", href: "/canvas", icon: Frame },
      { key: "video", href: "/video", icon: Clapperboard },
    ],
  },
  {
    key: "content",
    icon: FolderOpen,
    items: [
      { key: "history", href: "/history", icon: Clock3 },
      { key: "favorites", href: "/favorites", icon: FolderHeart },
      { key: "submissions", href: "/submissions", icon: Send },
    ],
  },
  {
    key: "billing",
    icon: Wallet,
    items: [
      { key: "credits", href: "/credits", icon: Coins },
      { key: "billing", href: "/billing", icon: ReceiptText },
    ],
  },
  {
    key: "help",
    icon: LifeBuoy,
    items: [
      { key: "tickets", href: "/tickets", icon: PencilLine },
      { key: "settings", href: "/settings", icon: Settings },
    ],
  },
];

// pathname 来自 @/i18n/navigation，已去掉 /en、/ru 前缀。
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

// 手机底部标签：创作类归「生成」，内容类归「作品」，交易与帮助类归「我的」。
function getTab(section: AppSection): MobileTabKey {
  if (section === "overview") return "overview";
  if (section === "generate" || section === "video") return "generate";
  if (section === "canvas") return "canvas";
  if (section === "history" || section === "favorites" || section === "submissions") {
    return "works";
  }

  return "me";
}

// 画布编辑器（/canvas/<id>）是全屏工具界面，底部标签栏会挡住画布控件；编辑器工具栏自带返回列表按钮，所以这里不显示标签栏。
function isEditor(pathname: string) {
  return pathname.startsWith("/canvas/");
}

function getFlush(pathname: string) {
  return pathname.startsWith("/generate") || pathname.startsWith("/video") || isEditor(pathname);
}

export function ProductFrame(props: ProductFrameProps) {
  const children = props.children;
  const topNav = props.topNav;
  const account = props.account;
  const t = useTranslations("nav.sidebar");
  const pathname = usePathname();
  const active = useMemo(() => getActiveSection(pathname), [pathname]);
  const flush = useMemo(() => getFlush(pathname), [pathname]);
  const [pendingNav, setPendingNav] = useState<PendingNav | null>(null);

  const overviewItems: Array<NavItem<AppSection>> = [
    { key: "overview", label: t("overview"), href: "/dashboard", icon: LayoutDashboard },
  ];

  const appNavGroups: Array<NavGroup<AppSection>> = sidebarGroups.map((group) => {
    const items = group.items.map((item) => {
      return { ...item, label: t(`items.${item.key}`) };
    });

    return {
      key: group.key,
      label: t(`groups.${group.key}`),
      icon: group.icon,
      items,
    };
  });

  const isPendingCurrent =
    pendingNav !== null &&
    (pathname === pendingNav.href || pathname.startsWith(`${pendingNav.href}/`));
  const visibleActive = pendingNav && !isPendingCurrent ? pendingNav.key : active;
  const hasTabBar = !isEditor(pathname);
  let mainClass = styles.shell__main;
  if (flush) {
    mainClass = styles.shell__mainFlush;
  }

  return (
    <div className={clsx(styles.shellPage, styles.shellPageApp, flush && styles.shellPageFlush)}>
      {topNav}
      <div className={clsx(styles.shell, flush && styles.shellFlush)}>
        <div className={clsx(styles.shell__grid, flush && styles.shell__gridFlush)}>
          <aside className={clsx(styles.shell__sidebar, styles.shell__sidebarDesktop)}>
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
      {hasTabBar ? (
        <MobileTabBar
          activeTab={getTab(visibleActive)}
          activeKey={visibleActive}
          groups={appNavGroups}
          account={account}
          onNavigate={(item) => setPendingNav({ href: item.href, key: item.key })}
        />
      ) : null}
    </div>
  );
}
