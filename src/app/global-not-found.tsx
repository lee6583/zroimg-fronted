import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import "antd/dist/reset.css";
import "@/style/index.css";
import { NotFoundView } from "@/components/layout/not-found-view";
import { routing } from "@/i18n/routing";

// 没有匹配任何路由（proxy 未处理的带点路径、/admin 下的未知路径、不支持的语言段）时渲染，跳过所有布局。
// 这里没有语言上下文，固定使用默认语言。
export const metadata: Metadata = {
  title: "404 | ZroImg",
};

export default function GlobalNotFound() {
  return (
    <html lang={routing.defaultLocale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={routing.defaultLocale}>
          <NotFoundView locale={routing.defaultLocale} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
