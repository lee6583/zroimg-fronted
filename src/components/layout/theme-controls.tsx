"use client";

import { Globe, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";
type Locale = "ZH" | "EN";

const themeKey = "zroimg-theme";
const localeKey = "zroimg-locale";
const settingsEvent = "zroimg-settings-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(settingsEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(settingsEvent, callback);
  };
}

function getThemeSnapshot(): Theme {
  return window.localStorage.getItem(themeKey) === "dark" ? "dark" : "light";
}

function getLocaleSnapshot(): Locale {
  return window.localStorage.getItem(localeKey) === "EN" ? "EN" : "ZH";
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function getServerLocaleSnapshot(): Locale {
  return "ZH";
}

function emitSettingsChange() {
  window.dispatchEvent(new Event(settingsEvent));
}

export function ThemeControls() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerThemeSnapshot);
  const locale = useSyncExternalStore(subscribe, getLocaleSnapshot, getServerLocaleSnapshot);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale === "ZH" ? "zh-CN" : "en";
  }, [theme, locale]);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    window.localStorage.setItem(themeKey, nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    emitSettingsChange();
  }

  function toggleLocale() {
    const nextLocale = locale === "ZH" ? "EN" : "ZH";
    window.localStorage.setItem(localeKey, nextLocale);
    document.documentElement.lang = nextLocale === "ZH" ? "zh-CN" : "en";
    emitSettingsChange();
  }

  return (
    <div className="flex items-center gap-1">
      <button
        className="nav-icon-button"
        type="button"
        onClick={toggleLocale}
        aria-label="切换语言"
      >
        <Globe size={17} />
      </button>
      <button
        className="nav-icon-button"
        type="button"
        onClick={toggleTheme}
        aria-label="切换明暗模式"
      >
        {theme === "light" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
