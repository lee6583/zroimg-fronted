"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import styles from "./brand-logo.module.css";

type Theme = "light" | "dark";

const themeKey = "zroimg-theme";
const settingsEvent = "zroimg-settings-change";

function readStoredTheme() {
  const storedTheme = window.localStorage.getItem(themeKey);
  if (storedTheme === "dark" || storedTheme === "light") {
    return storedTheme;
  }

  return null;
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window.addEventListener(settingsEvent, callback);

  return () => {
    observer.disconnect();
    window.removeEventListener(settingsEvent, callback);
  };
}

function getThemeSnapshot(): Theme {
  const storedTheme = readStoredTheme();
  if (storedTheme) {
    return storedTheme;
  }

  const pageTheme = document.documentElement.dataset.theme;
  if (pageTheme === "dark" || pageTheme === "light") {
    return pageTheme;
  }

  return "light";
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
