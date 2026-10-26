import "server-only";

import defaultMessages from "../../messages/zh-CN.json";
import { mergeMessages } from "./merge-messages";
import type { AppLocale } from "./routing";
import { routing } from "./routing";

type Messages = typeof defaultMessages;
type MessagesLoader = () => Promise<{ default: unknown }>;

// 新增语言时在这里加一行 loader（见 docs/i18n.md「新增语言」）；默认语言 zh-CN 直接静态导入，不需要 loader。
const loaders: Record<AppLocale, MessagesLoader | null> = {
  "zh-CN": null,
  en: () => import("../../messages/en.json"),
  ru: () => import("../../messages/ru.json"),
};

const isDev = process.env.NODE_ENV !== "production";
const reportedLocales = new Set<string>();

export async function loadMessages(locale: AppLocale): Promise<Messages> {
  const loader = loaders[locale];
  if (!loader) {
    return defaultMessages;
  }

  const localeModule = await loader();
  const missing: string[] = [];
  const merged = mergeMessages(defaultMessages, localeModule.default, missing);

  // 开发环境每种语言只提示一次缺失数量，完整清单用 pnpm i18n:check 查看。
  if (isDev && missing.length > 0 && !reportedLocales.has(locale)) {
    reportedLocales.add(locale);
    console.warn(
      `[i18n] ${locale}: ${missing.length} 条文案未翻译，已回退到 ${routing.defaultLocale}（pnpm i18n:check 查看明细）`,
    );
  }

  // mergeMessages 保证结构与 zh-CN 完全一致。
  return merged as Messages;
}
