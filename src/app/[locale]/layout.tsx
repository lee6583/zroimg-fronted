import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { RootDocument } from "@/components/layout/root-document";
import { IntlErrorHandlingProvider } from "@/i18n/intl-error-handling-provider";
import { routing } from "@/i18n/routing";
import { buildSiteMetadata } from "@/lib/seo";

// 只接受 routing.locales 中的语言；其他值（例如 proxy 未处理的 /foo.txt）按未匹配路由交给 global-not-found。
export const dynamicParams = false;

// viewport-fit=cover 让页面延伸到刘海/底部横条区域，底部固定元素用 env(safe-area-inset-bottom) 自行避让。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(props: LayoutProps<"/[locale]">): Promise<Metadata> {
  const params = await props.params;
  const locale = params.locale;
  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "metadata.site" });

  return buildSiteMetadata({
    locale,
    title: t("title"),
    description: t("description"),
  });
}

export default async function LocaleLayout(props: LayoutProps<"/[locale]">) {
  const params = await props.params;
  const locale = params.locale;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // i18n/request.ts 已从 next/root-params 读取语言；这里再写入请求缓存，兼容依赖请求头的旧路径。
  setRequestLocale(locale);

  return (
    <RootDocument lang={locale}>
      <NextIntlClientProvider>
        <IntlErrorHandlingProvider>{props.children}</IntlErrorHandlingProvider>
      </NextIntlClientProvider>
    </RootDocument>
  );
}
