import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

// 普通访问：URL 前缀 > NEXT_LOCALE Cookie > Accept-Language > zh-CN。
const handleI18nRouting = createMiddleware(routing);

// 搜索引擎和预览抓取：只认 URL，无前缀永远是 zh-CN，不会因为 Accept-Language 被重定向走。
const handleCrawlerRouting = createMiddleware({
  ...routing,
  localeDetection: false,
});

const crawlerPattern =
  /bot|crawl|spider|slurp|bingpreview|mediapartners|facebookexternalhit|embedly|quora link preview|whatsapp|telegram|vkshare|yandex|baidu|sogou|bytespider|petalbot|headlesschrome|lighthouse/i;

function isCrawler(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  return crawlerPattern.test(userAgent);
}

export default function proxy(request: NextRequest) {
  if (isCrawler(request)) {
    return handleCrawlerRouting(request);
  }

  return handleI18nRouting(request);
}

export const config = {
  // 只处理页面路由。排除：
  // - /api（开发期 rewrites 到 Java，生产由 nginx 转发）
  // - /admin（后台只有中文，不进入 [locale]）
  // - /_next、/_vercel 内部路径
  // - 带点的路径：静态文件、sitemap.xml、robots.txt、favicon.ico 等元数据路由
  matcher: "/((?!api|admin|_next|_vercel|.*\\..*).*)",
};
