import "server-only";
import type { AppLocale } from "@/i18n/routing";
import { enDocs } from "./en";
import { docsSections } from "./navigation";
import { ruDocs } from "./ru";
import type { DocsLocaleContent, DocsSlug } from "./types";
import { zhCNDocs } from "./zh-CN";

const contentByLocale: Record<AppLocale, DocsLocaleContent> = {
  "zh-CN": zhCNDocs,
  en: enDocs,
  ru: ruDocs,
};

export function getDocsContent(locale: AppLocale) {
  return contentByLocale[locale];
}

export function getDocsPage(locale: AppLocale, slug: DocsSlug) {
  return contentByLocale[locale][slug];
}

/** 侧边栏数据：只含可序列化的标题和路径，交给客户端组件。 */
export function getDocsNavigation(locale: AppLocale) {
  const content = contentByLocale[locale];

  const sections = docsSections.map((section) => {
    const items = section.slugs.map((slug) => {
      const item = {
        slug,
        href: `/docs/${slug}`,
        title: content[slug].navTitle,
      };

      return item;
    });

    return { key: section.key, items };
  });

  return sections;
}

/** 阅读顺序里的上一页和下一页。 */
export function getDocsNeighbors(locale: AppLocale, slug: DocsSlug) {
  const content = contentByLocale[locale];
  const slugs = docsSections.flatMap((section) => section.slugs);
  const position = slugs.indexOf(slug);
  const previousSlug = slugs[position - 1];
  const nextSlug = slugs[position + 1];

  let previous = null;
  if (previousSlug) {
    previous = { href: `/docs/${previousSlug}`, title: content[previousSlug].navTitle };
  }

  let next = null;
  if (nextSlug) {
    next = { href: `/docs/${nextSlug}`, title: content[nextSlug].navTitle };
  }

  return { previous, next };
}

export type DocsNavigationSection = ReturnType<typeof getDocsNavigation>[number];
