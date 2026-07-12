"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import styles from "./brand-logo.module.css";

type Theme = "light" | "dark";

const settingsEvent = "zroimg-settings-change";

function subscribe(callback: () => void) {
  const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const observer = new MutationObserver(callback);

  function onSystemThemeChange() {
    document.documentElement.dataset.theme = themeQuery.matches ? "dark" : "light";
    callback();
  }

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window.addEventListener(settingsEvent, callback);
  themeQuery.addEventListener("change", onSystemThemeChange);

  return () => {
    observer.disconnect();
    window.removeEventListener(settingsEvent, callback);
    themeQuery.removeEventListener("change", onSystemThemeChange);
  };
}

function getThemeSnapshot(): Theme {
  const pageTheme = document.documentElement.dataset.theme;
  if (pageTheme === "dark" || pageTheme === "light") {
    return pageTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

export function BrandLogo() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);
  const iconSrc = theme === "dark" ? "/assets/night-icon.png" : "/assets/day-icon.png";

  return (
    <Link href="/" className={styles.brandLogo} aria-label="ZroImg 首页">
      <span className={styles.brandLogo__mark} aria-hidden="true">
        <Image
          key={iconSrc}
          src={iconSrc}
          alt=""
          width={32}
          height={32}
          unoptimized
          className={styles.brandLogo__icon}
        />
      </span>
      <span className={styles.brandLogo__text}>ZroImg</span>
    </Link>
  );
}
