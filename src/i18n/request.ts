import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import * as rootParams from "next/root-params";
import { getIntlMessageFallback, onIntlError } from "./error-handling";
import { formats, timeZone } from "./formats";
import { loadMessages } from "./messages";
import { routing } from "./routing";

async function readRootLocale() {
  try {
    return await rootParams.locale();
  } catch {
    // Server Action 等不支持 next/root-params 的上下文，交给 proxy 写入的请求头。
    return undefined;
  }
}

export default getRequestConfig(async (params) => {
  // 第一步：显式传入的 locale（getTranslations({ locale })）优先。
  let locale = params.locale;

  // 第二步：[locale] 根布局下读取路由参数；未知值直接 404。
  if (!locale) {
    const rootLocale = await readRootLocale();
    if (rootLocale !== undefined) {
      if (!hasLocale(routing.locales, rootLocale)) {
        notFound();
      }
      locale = rootLocale;
    }
  }

  // 第三步：没有 [locale] 段的路由（/admin）回退到 proxy 请求头或默认中文。
  if (!locale) {
    const requested = await params.requestLocale;
    locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  }

  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
    formats,
    timeZone,
    onError: onIntlError,
    getMessageFallback: getIntlMessageFallback,
  };
});
