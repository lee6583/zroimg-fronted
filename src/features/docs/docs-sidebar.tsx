"use client";

import {
  BookOpen,
  Boxes,
  Braces,
  ChevronRight,
  CircleAlert,
  Clapperboard,
  Coins,
  Compass,
  ImageIcon,
  KeyRound,
  ListChecks,
  PanelLeft,
  Rocket,
  Sparkles,
  Wallet,
  WandSparkles,
  Waypoints,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SideNav, type NavGroup, type NavItem } from "@/components/layout/side-nav";
import { Sheet } from "@/components/ui/sheet";
import type { DocsNavigationSection } from "@/content/docs";
import type { DocsSectionKey, DocsSlug } from "@/content/docs/types";
import { usePathname } from "@/i18n/navigation";
import styles from "./docs.module.css";

type DocsSidebarProps = {
  sections: DocsNavigationSection[];
};

type DocsNavKey = DocsSlug | "overview";

const sectionIcons: Record<DocsSectionKey, LucideIcon> = {
  guide: Compass,
  api: KeyRound,
  endpoints: Braces,
};

const pageIcons: Record<DocsSlug, LucideIcon> = {
  introduction: Sparkles,
  quickstart: Rocket,
  billing: Coins,
  "api/overview": Waypoints,
  "api/errors": CircleAlert,
  "api/models": Boxes,
  "api/images": ImageIcon,
  "api/videos": Clapperboard,
  "api/tasks": ListChecks,
  "api/polish": WandSparkles,
  "api/balance": Wallet,
};

const storageKey = "zroimg.nav.docs";

/** 文档左侧导航：复用应用侧边栏（分组可折叠、记住状态）；< 1024px 收进吸顶条，点开为 Sheet。 */
export function DocsSidebar(props: DocsSidebarProps) {
  const sections = props.sections;
  const t = useTranslations("docs");
  const pathname = usePathname();
  const [isOpen, setOpen] = useState(false);

  // 第一步：文档首页作为顶层入口，各分区作为可折叠分组。
  const overviewItem: NavItem<DocsNavKey> = {
    key: "overview",
    label: t("overview.navTitle"),
    href: "/docs",
    icon: BookOpen,
  };
  const groups: Array<NavGroup<DocsNavKey>> = sections.map((section) => {
    const items = section.items.map((item) => {
      const navItem: NavItem<DocsNavKey> = {
        key: item.slug,
        label: item.title,
        href: item.href,
        icon: pageIcons[item.slug],
      };

      return navItem;
    });

    return {
      key: section.key,
      label: t(`sections.${section.key}`),
      icon: sectionIcons[section.key],
      items,
    };
  });

  // 第二步：按当前地址找到高亮项，吸顶条上显示它的标题。
  const pages = groups.flatMap((group) => group.items);
  const current = pages.find((item) => item.href === pathname);
  let activeKey: DocsNavKey | null = null;
  let currentTitle = overviewItem.label;
  if (pathname === "/docs") {
    activeKey = "overview";
  }
  if (current) {
    activeKey = current.key;
    currentTitle = current.label;
  }

  return (
    <>
      <aside className={styles.docs__sidebar} aria-label={t("navLabel")}>
        <SideNav
          storageKey={storageKey}
          items={[overviewItem]}
          groups={groups}
          activeKey={activeKey}
        />
      </aside>

      <div className={styles.docs__mobileBar}>
        <button
          type="button"
          className={styles.docs__mobileBarButton}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <PanelLeft size={17} aria-hidden />
          <span className={styles.docs__mobileBarLabel}>{t("menu")}</span>
          <ChevronRight size={14} aria-hidden className={styles.docs__mobileBarDivider} />
          <span className={styles.docs__mobileBarCurrent} title={currentTitle}>
            {currentTitle}
          </span>
        </button>
      </div>

      <Sheet
        open={isOpen}
        onClose={() => setOpen(false)}
        desktop="drawer"
        title={
          <span className={styles.docs__sheetTitle}>
            <BookOpen size={16} aria-hidden />
            {t("navLabel")}
          </span>
        }
      >
        <SideNav
          storageKey={storageKey}
          items={[overviewItem]}
          groups={groups}
          activeKey={activeKey}
          onNavigate={() => setOpen(false)}
          isVertical
        />
      </Sheet>
    </>
  );
}
