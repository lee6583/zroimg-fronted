"use client";

import { useEffect, useRef, useState } from "react";
import type { MouseEvent } from "react";
import clsx from "clsx";
import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, routing, type AppLocale } from "@/i18n/routing";
import styles from "./locale-switcher.module.css";

/**
 * 语言切换：保留当前路径和查询参数，跳到另一种语言的同一页面。
 * useRouter().replace(..., { locale }) 会先写 NEXT_LOCALE Cookie，再跳到带前缀的地址；
 * 切回 zh-CN 时会先到 /zh-CN/...，再由 proxy 重定向到无前缀地址。
 * 渲染成 <Link hrefLang> 是为了无 JS 时也能切换，并让爬虫看到语言版本。
 */
export function LocaleSwitcher() {
  const t = useTranslations("nav.locale");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  function switchLocale(event: MouseEvent<HTMLAnchorElement>, nextLocale: AppLocale) {
    event.preventDefault();
    setOpen(false);

    if (nextLocale === locale) {
      return;
    }

    // 查询参数只在点击时读取，避免 useSearchParams 让整页退出静态渲染。
    const href = `${pathname}${window.location.search}`;
    router.replace(href, { locale: nextLocale });
  }

  return (
    <div ref={rootRef} className={styles.localeSwitcher}>
      <button
        className="nav-icon-button"
        type="button"
        aria-label={t("label")}
        title={t("label")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
      >
        <Globe size={17} />
      </button>

      {isOpen ? (
        <div className={styles.localeSwitcher__menu} role="menu" aria-label={t("label")}>
          {routing.locales.map((item) => {
            const isActive = item === locale;

            return (
              <Link
                key={item}
                href={pathname}
                locale={item}
                lang={item}
                role="menuitemradio"
                aria-checked={isActive}
                className={clsx(
                  styles.localeSwitcher__item,
                  isActive && styles.localeSwitcher__itemActive,
                )}
                onClick={(event) => switchLocale(event, item)}
              >
                <span>{localeNames[item]}</span>
                {isActive ? <Check size={15} className={styles.localeSwitcher__check} /> : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
