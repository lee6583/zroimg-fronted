import type { DocsSection, DocsSlug } from "./types";

// 侧边栏分组和阅读顺序（上一页/下一页、sitemap）都以这里为准。新增页面：在这里登记 slug，
// 再给每种语言的内容文件补一条；DocsLocaleContent 的类型会提示缺少的语言。
export const docsSections: DocsSection[] = [
  {
    key: "guide",
    slugs: ["introduction", "quickstart", "billing"],
  },
  {
    key: "api",
    slugs: ["api/overview", "api/errors"],
  },
  {
    key: "endpoints",
    slugs: ["api/models", "api/images", "api/videos", "api/tasks", "api/polish", "api/balance"],
  },
];

export const docsSlugs: DocsSlug[] = docsSections.flatMap((section) => section.slugs);

// 内置文档最近一次实质更新的日期，sitemap 使用；改文档内容时同步修改。
export const docsLastModified = "2026-10-27";

export function isDocsSlug(value: string): value is DocsSlug {
  const slugs: readonly string[] = docsSlugs;

  return slugs.includes(value);
}

export function docsPath(slug: DocsSlug) {
  return `/docs/${slug}`;
}
