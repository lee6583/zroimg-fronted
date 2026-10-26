"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useSyncExternalStore } from "react";

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

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(settingsEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
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

function emitSettingsChange() {
  window.dispatchEvent(new Event(settingsEvent));
}

function saveCookie(name: string, value: string) {
  document.cookie = `${name}=${value};path=/;max-age=31536000;samesite=lax`;
}

/** 当前主题与切换函数；顶栏按钮和手机端菜单里的开关共用。 */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    window.localStorage.setItem(themeKey, nextTheme);
    saveCookie("zroimg-theme", nextTheme);
    applyTheme(nextTheme);
    emitSettingsChange();
  }

  return { theme, toggleTheme };
}

// 语言切换在 LocaleSwitcher；<html lang> 由根布局按路由语言输出，这里不再改动。
export function ThemeControls() {
  const t = useTranslations("nav.theme");
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="nav-icon-button"
      type="button"
      onClick={toggleTheme}
      aria-label={t("toggle")}
    >
      {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
