"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useFormatter, useTranslations } from "next-intl";
import {
  CircleUserRound,
  Clock3,
  Frame,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Link, usePathname } from "@/i18n/navigation";
import { useLogout } from "./account-menu";
import {
  MenuLink,
  MenuLocaleRow,
  MenuSection,
  MenuThemeRow,
  mobileMenuStyles,
} from "./mobile-menu";
import type { NavGroup, NavItem } from "./side-nav";
import styles from "./mobile-tab-bar.module.css";

type MobileTabKey = "overview" | "generate" | "canvas" | "works" | "me";

type MobileAccount = {
  username: string;
  email: string;
  avatarUrl: string | null;
  totalPoints: number;
};

type MobileTabBarProps<K extends string> = {
  activeTab: MobileTabKey;
  activeKey: K;
  groups: Array<NavGroup<K>>;
  account: MobileAccount;
  onNavigate: (item: NavItem<K>) => void;
};

type TabLinkDef = {
  key: Exclude<MobileTabKey, "me">;
  href: string;
  icon: LucideIcon;
};

type PendingTab = {
  key: TabLinkDef["key"];
  fromPath: string;
};

const tabLinks: TabLinkDef[] = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "generate", href: "/generate", icon: ImagePlus },
  { key: "canvas", href: "/canvas", icon: Frame },
  { key: "works", href: "/history", icon: Clock3 },
];

const nonTextInputTypes = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

function isTextEntry(target: EventTarget | null) {
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) return !nonTextInputTypes.has(target.type);
  if (target instanceof HTMLElement) return target.isContentEditable;
  return false;
}

// 手机上没有可靠的「软键盘已弹出」事件：以文本输入框获得焦点作为近似，输入时收起标签栏，把高度让给输入区。
function useIsTyping() {
  const [isTyping, setTyping] = useState(false);

  useEffect(() => {
    function onFocusIn(event: FocusEvent) {
      setTyping(isTextEntry(event.target));
    }

    function onFocusOut(event: FocusEvent) {
      if (!isTextEntry(event.relatedTarget)) {
        setTyping(false);
      }
    }

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  return isTyping;
}

/**
 * 手机端（< 768px）底部标签栏：概览 / 生成 / 画布 / 作品 / 我的。桌面端由 CSS 隐藏。
 * 显示时在自身写 data-app-tabbar="visible"，全局样式据此给 body 设置 --app-tabbar-height，
 * 页面里固定在底部的元素用 bottom: var(--app-tabbar-height, 0px) 避开它。
 */
export function MobileTabBar<K extends string>(props: MobileTabBarProps<K>) {
  const activeTab = props.activeTab;
  const activeKey = props.activeKey;
  const groups = props.groups;
  const account = props.account;
  const onNavigate = props.onNavigate;
  const t = useTranslations("nav");
  const format = useFormatter();
  const isTyping = useIsTyping();
  const pathname = usePathname();
  const [isMeOpen, setMeOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<PendingTab | null>(null);
  const { isLoggingOut, logout } = useLogout();

  // 点击后立即高亮目标标签；只要路径一变（跳转完成或去了别处），就回到按路径计算的结果。
  let visibleTab = activeTab;
  if (pendingTab && pendingTab.fromPath === pathname) {
    visibleTab = pendingTab.key;
  }

  function closeMe() {
    setMeOpen(false);
  }

  return (
    <>
      <nav
        className={clsx(styles.mobileTabBar, isTyping && styles.mobileTabBarHidden)}
        aria-label={t("tabs.label")}
        data-app-tabbar={isTyping ? "hidden" : "visible"}
      >
        {tabLinks.map((tab) => {
          const Icon = tab.icon;
          const isActive = visibleTab === tab.key;

          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setPendingTab({ key: tab.key, fromPath: pathname })}
              className={clsx(styles.mobileTabBar__tab, isActive && styles.mobileTabBar__tabActive)}
            >
              <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} aria-hidden />
              <span className={styles.mobileTabBar__label}>{t(`tabs.${tab.key}`)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isMeOpen}
          onClick={() => setMeOpen(true)}
          className={clsx(
            styles.mobileTabBar__tab,
            (visibleTab === "me" || isMeOpen) && styles.mobileTabBar__tabActive,
          )}
        >
          <CircleUserRound size={22} strokeWidth={visibleTab === "me" ? 2.2 : 1.8} aria-hidden />
          <span className={styles.mobileTabBar__label}>{t("tabs.me")}</span>
        </button>
      </nav>

      <Sheet open={isMeOpen} onClose={closeMe} title={t("me.title")}>
        <div className={mobileMenuStyles.mobileMenu__account}>
          <UserAvatar name={account.username} src={account.avatarUrl} size={44} decorative />
          <div className={mobileMenuStyles.mobileMenu__accountText}>
            <span className={mobileMenuStyles.mobileMenu__accountName} title={account.username}>
              {account.username}
            </span>
            <span className={mobileMenuStyles.mobileMenu__accountEmail} title={account.email}>
              {account.email}
            </span>
          </div>
          <Link href="/credits" className={mobileMenuStyles.mobileMenu__points} onClick={closeMe}>
            <span className={mobileMenuStyles.mobileMenu__pointsValue}>
              {format.number(account.totalPoints, "points")}
            </span>
            <span className={mobileMenuStyles.mobileMenu__pointsLabel}>{t("me.points")}</span>
          </Link>
        </div>

        {groups.map((group) => (
          <MenuSection key={group.key} title={group.label}>
            {group.items.map((item) => (
              <MenuLink
                key={item.key}
                href={item.href}
                label={item.label}
                icon={item.icon}
                isActive={item.key === activeKey}
                onNavigate={() => {
                  setPendingTab(null);
                  onNavigate(item);
                  closeMe();
                }}
              />
            ))}
          </MenuSection>
        ))}

        <MenuSection>
          <MenuLocaleRow onSwitch={closeMe} />
          <MenuThemeRow />
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={logout}
            className={clsx(mobileMenuStyles.mobileMenu__row, mobileMenuStyles.mobileMenu__logout)}
          >
            <span className={mobileMenuStyles.mobileMenu__icon}>
              <LogOut size={18} />
            </span>
            <span className={mobileMenuStyles.mobileMenu__label}>{t("account.logout")}</span>
          </button>
        </MenuSection>
      </Sheet>
    </>
  );
}

export type { MobileAccount, MobileTabKey };
