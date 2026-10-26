import { defineRouting } from "next-intl/routing";

// 新增语言时同步修改：locales、localeNames、openGraphLocales 与 messages/<locale>.json（见 docs/i18n.md）。
export const routing = defineRouting({
  locales: ["zh-CN", "en", "ru"],
  defaultLocale: "zh-CN",
  // 默认语言不带前缀：/gallery 是中文，/en/gallery、/ru/gallery 是其他语言。
  localePrefix: "as-needed",
  localeCookie: {
    name: "NEXT_LOCALE",
    // 用户主动选择的语言保留一年，避免关闭浏览器后又被 Accept-Language 带走。
    maxAge: 60 * 60 * 24 * 365,
  },
  // hreflang 由 buildMetadata 写进 HTML 和 sitemap，不再让 proxy 给每个响应（包括不收录的应用页）加 Link 头。
  alternateLinks: false,
});

type AppLocale = (typeof routing.locales)[number];

// 语言切换器始终用各语言的母语名称展示，不进翻译文件。
export const localeNames: Record<AppLocale, string> = {
  "zh-CN": "简体中文",
  en: "English",
  ru: "Русский",
};

export const openGraphLocales: Record<AppLocale, string> = {
  "zh-CN": "zh_CN",
  en: "en_US",
  ru: "ru_RU",
};

export type { AppLocale };
