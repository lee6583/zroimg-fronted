import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { absoluteUrl, languageAlternates, localizedPath } from "@/lib/seo";
import { publicPages } from "@/lib/site-routes";

type SitemapEntry = MetadataRoute.Sitemap[number];

type SitemapSource = {
  path: string;
  lastModified: string | Date;
  changeFrequency: SitemapEntry["changeFrequency"];
  priority: number;
  images?: string[];
};

// 每个页面 × 每种语言各一条，并带上全部语言的 hreflang（含 x-default）。
function expand(source: SitemapSource) {
  const languages = languageAlternates(source.path);

  const entries: MetadataRoute.Sitemap = routing.locales.map((locale) => {
    const entry: SitemapEntry = {
      url: absoluteUrl(localizedPath(locale, source.path)),
      lastModified: source.lastModified,
      changeFrequency: source.changeFrequency,
      priority: source.priority,
      alternates: { languages },
      images: source.images,
    };

    return entry;
  });

  return entries;
}

/**
 * 预留：画廊详情页（/gallery/[id]）上线后，在这里请求 Java 的公开作品列表，
 * 返回 { path: `/gallery/${id}`, lastModified, images: [absoluteUrl(publicAssetUrl(id))] }。
 * 届时 sitemap 需要改为按需生成（export const revalidate = 3600），条目过多时用 generateSitemaps 分片。
 */
async function listGallerySources(): Promise<SitemapSource[]> {
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const gallerySources = await listGallerySources();
  const sources: SitemapSource[] = [...publicPages, ...gallerySources];

  return sources.flatMap(expand);
}
