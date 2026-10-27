import type { MetadataRoute } from "next";
import { docsLastModified, docsPath, docsSlugs } from "@/content/docs/navigation";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

type PublicPage = {
  // 不带语言前缀的内部路径
  path: string;
  changeFrequency: ChangeFrequency;
  priority: number;
  // 页面内容最近一次实质更新的日期；改版公开页时同步修改。
  lastModified: string;
};

// 可被收录的公开页面：sitemap 按这里 × 全部语言输出，每个页面都必须用 buildMetadata 输出 canonical / hreflang。
export const publicPages: PublicPage[] = [
  { path: "/", changeFrequency: "weekly", priority: 1, lastModified: "2026-10-26" },
  { path: "/gallery", changeFrequency: "daily", priority: 0.8, lastModified: "2026-10-26" },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.7, lastModified: "2026-10-26" },
  { path: "/docs", changeFrequency: "weekly", priority: 0.6, lastModified: docsLastModified },
  // 内置文档每页一条，slug 与阅读顺序见 src/content/docs/navigation.ts
  ...docsSlugs.map((slug) => {
    const page: PublicPage = {
      path: docsPath(slug),
      changeFrequency: "monthly",
      priority: 0.5,
      lastModified: docsLastModified,
    };

    return page;
  }),
  { path: "/licenses", changeFrequency: "yearly", priority: 0.2, lastModified: "2026-10-26" },
];

// 登录后的应用页：robots.txt 在所有语言前缀下禁止抓取，页面本身也输出 noindex。
export const appPaths = [
  "/dashboard",
  "/generate",
  "/canvas",
  "/video",
  "/history",
  "/favorites",
  "/submissions",
  "/credits",
  "/billing",
  "/tickets",
  "/settings",
];

export type { PublicPage };
