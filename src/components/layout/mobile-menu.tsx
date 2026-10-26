"use client";

import type { ReactNode } from "react";
import clsx from "clsx";
import { ChevronRight, Globe, Moon, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { localeNames, routing } from "@/i18n/routing";
import { useSwitchLocale } from "./locale-switcher";
import { useTheme } from "./theme-controls";
import styles from "./mobile-menu.module.css";

// 手机端「我的」和公开页菜单（都放在 Sheet 里）共用的大尺寸行。

type MenuSectionProps = {
  title?: string;
  children: ReactNode;
};

type MenuLinkProps = {
  href: string;
  label: string;
  icon?: LucideIcon;
  isActive?: boolean;
  onNavigate?: () => void;
};

export function MenuSection(props: MenuSectionProps) {
  const title = props.title;

  return (
    <section className={styles.mobileMenu__section}>
      {title ? <h3 className={styles.mobileMenu__sectionTitle}>{title}</h3> : null}
      <div className={styles.mobileMenu__list}>{props.children}</div>
    </section>
  );
}

export function MenuLink(props: MenuLinkProps) {
  const Icon = props.icon;
  const isActive = props.isActive ?? false;

  return (
    <Link
      href={props.href}
      aria-current={isActive ? "page" : undefined}
      onClick={props.onNavigate}
      className={clsx(styles.mobileMenu__row, isActive && styles.mobileMenu__rowActive)}
    >
      {Icon ? (
        <span className={styles.mobileMenu__icon}>
          <Icon size={18} />
        </span>
      ) : null}
      <span className={styles.mobileMenu__label}>{props.label}</span>
      <ChevronRight size={16} aria-hidden className={styles.mobileMenu__chevron} />
    </Link>
  );
}

type MenuLocaleRowProps = {
  onSwitch?: () => void;
};

export function MenuLocaleRow(props: MenuLocaleRowProps) {
  const onSwitch = props.onSwitch;
  const t = useTranslations("nav.me");
  const { locale, pathname, switchLocale } = useSwitchLocale();

  return (
    <div className={styles.mobileMenu__row} role="group" aria-label={t("language")}>
      <span className={styles.mobileMenu__icon}>
        <Globe size={18} />
      </span>
      <span className={styles.mobileMenu__label}>{t("language")}</span>
      <span className={styles.mobileMenu__segments}>
        {routing.locales.map((item) => {
          const isActive = item === locale;

          return (
            <Link
              key={item}
              href={pathname}
              locale={item}
              lang={item}
              aria-current={isActive ? "true" : undefined}
              className={clsx(
                styles.mobileMenu__segment,
                isActive && styles.mobileMenu__segmentActive,
              )}
              onClick={(event) => {
                switchLocale(event, item);
                if (!isActive) onSwitch?.();
              }}
            >
              {localeNames[item]}
            </Link>
          );
        })}
      </span>
    </div>
  );
}

export function MenuThemeRow() {
  const t = useTranslations("nav.me");
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={toggleTheme}
      className={styles.mobileMenu__row}
    >
      <span className={styles.mobileMenu__icon}>
        <Moon size={18} />
      </span>
      <span className={styles.mobileMenu__label}>{t("darkMode")}</span>
      <span
        className={clsx(styles.mobileMenu__switch, isDark && styles.mobileMenu__switchOn)}
        aria-hidden
      />
    </button>
  );
}

export { styles as mobileMenuStyles };
