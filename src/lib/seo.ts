import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { openGraphLocales, routing, type AppLocale } from "@/i18n/routing";

type SeoImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

type BuildMetadataOptions = {
  locale: AppLocale;
  // 不带语言前缀的内部路径，例如 "/"、"/gallery"。
  path: string;
  title: string;
  description: string;
  images?: SeoImage[];
  // 不收录的页面：不输出 canonical / hreflang，robots 为 noindex, nofollow。
  noindex?: boolean;
  // 首页等需要完整标题的页面设为 true，不套用 "%s | ZroImg" 模板。
  isAbsoluteTitle?: boolean;
};

type SiteMetadataOptions = {
  locale: AppLocale;
  title: string;
  description: string;
};

export const siteName = "ZroImg";

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://zroimg.com").replace(
  /\/+$/,
  "",
);

const titleTemplate = `%s | ${siteName}`;

const defaultImages: SeoImage[] = [
  {
    url: "/assets/creative.png",
    width: 1699,
    height: 926,
    alt: siteName,
  },
];

const noindexRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
};

const siteIcons: Metadata["icons"] = {
  icon: [
    {
      url: "/assets/day-icon.png",
      sizes: "512x512",
      type: "image/png",
      media: "(prefers-color-scheme: light)",
    },
    {
      url: "/assets/night-icon.png",
      sizes: "512x512",
      type: "image/png",
      media: "(prefers-color-scheme: dark)",
    },
  ],
  apple: [
    {
      url: "/assets/day-icon.png",
      sizes: "512x512",
      type: "image/png",
      media: "(prefers-color-scheme: light)",
    },
    {
      url: "/assets/night-icon.png",
      sizes: "512x512",
      type: "image/png",
      media: "(prefers-color-scheme: dark)",
    },
  ],
};

/** 内部路径 -> 当前语言的对外路径：zh-CN 不带前缀，其余语言带 /en、/ru。 */
export function localizedPath(locale: AppLocale, path: string) {
  return getPathname({ locale, href: path });
}

/** 站内路径 -> 绝对地址，基于 NEXT_PUBLIC_SITE_URL。 */
export function absoluteUrl(path: string) {
  return new URL(path, `${siteUrl}/`).toString();
}

/**
 * hreflang 列表：三种语言各一条，外加 x-default。
 * x-default 指向无前缀的中文地址：普通用户访问时 proxy 会按 Cookie / Accept-Language 协商，爬虫始终拿到中文。
 */
export function languageAlternates(path: string) {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = absoluteUrl(localizedPath(locale, path));
  }

  languages["x-default"] = absoluteUrl(localizedPath(routing.defaultLocale, path));

  return languages;
}

/** 根布局使用：站点级默认值。页面级 metadata 再用 buildMetadata 覆盖。 */
export function buildSiteMetadata(options: SiteMetadataOptions): Metadata {
  const locale = options.locale;
  const title = options.title;
  const description = options.description;

  const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    applicationName: siteName,
    title: {
      default: title,
      template: titleTemplate,
    },
    description,
    icons: siteIcons,
    openGraph: {
      type: "website",
      siteName,
      locale: openGraphLocales[locale],
      title,
      description,
      images: defaultImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: defaultImages.map((image) => image.url),
    },
  };

  return metadata;
}

/** 页面级 metadata：标题、描述、canonical、hreflang、OpenGraph、Twitter 与 robots。 */
export function buildMetadata(options: BuildMetadataOptions): Metadata {
  const locale = options.locale;
  const path = options.path;
  const title = options.title;
  const description = options.description;
  const images = options.images ?? defaultImages;
  const isNoindex = options.noindex ?? false;

  // OpenGraph / Twitter 不会套用 title.template，这里自己拼完整标题。
  let fullTitle = `${title} | ${siteName}`;
  let pageTitle: Metadata["title"] = title;
  if (options.isAbsoluteTitle) {
    fullTitle = title;
    pageTitle = { absolute: title };
  }

  const url = absoluteUrl(localizedPath(locale, path));
  const alternateLocales = routing.locales.filter((item) => item !== locale);

  const metadata: Metadata = {
    title: pageTitle,
    description,
    openGraph: {
      type: "website",
      siteName,
      locale: openGraphLocales[locale],
      alternateLocale: alternateLocales.map((item) => openGraphLocales[item]),
      url,
      title: fullTitle,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: images.map((image) => image.url),
    },
  };

  if (isNoindex) {
    metadata.robots = noindexRobots;
    return metadata;
  }

  metadata.alternates = {
    canonical: url,
    languages: languageAlternates(path),
  };
  metadata.robots = {
    index: true,
    follow: true,
  };

  return metadata;
}

export { noindexRobots, siteIcons };
export type { BuildMetadataOptions, SeoImage };
