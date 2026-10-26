import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl, localizedPath } from "@/lib/seo";
import { appPaths } from "@/lib/site-routes";

// 公开页允许抓取；后台、接口和登录后的应用页（含 /en、/ru 前缀）禁止抓取。
// 登录/注册页不在这里屏蔽：它们输出 noindex，需要允许抓取才能让搜索引擎看到 noindex。
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/api/"];

  for (const path of appPaths) {
    for (const locale of routing.locales) {
      disallow.push(localizedPath(locale, path));
    }
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow,
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
