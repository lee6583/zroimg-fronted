import type { AppLocale } from "@/i18n/routing";
import { absoluteUrl, localizedPath, siteName, siteUrl } from "@/lib/seo";

type JsonLdValue = string | number | boolean | null | JsonLdObject | JsonLdValue[];
type JsonLdObject = { [key: string]: JsonLdValue | undefined };

type ImageGalleryItem = {
  // 站内或绝对图片地址
  imageUrl: string;
  name: string;
  description?: string;
  authorName?: string;
  // ISO 8601，带时区；Java 时间先用 parseJavaDateTime 转换
  datePublished?: string;
  width?: number;
  height?: number;
};

type ImageGalleryOptions = {
  locale: AppLocale;
  path: string;
  name: string;
  description: string;
  items: ImageGalleryItem[];
};

const logoPath = "/assets/day-icon.png";

export function organization(): JsonLdObject {
  const result: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: siteUrl,
    logo: absoluteUrl(logoPath),
  };

  return result;
}

// 站内暂无搜索功能，因此不输出 potentialAction / SearchAction。
export function website(locale: AppLocale): JsonLdObject {
  const result: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: absoluteUrl(localizedPath(locale, "/")),
    inLanguage: locale,
  };

  return result;
}

export function imageGallery(options: ImageGalleryOptions): JsonLdObject {
  const images = options.items.map((item) => {
    const image: JsonLdObject = {
      "@type": "ImageObject",
      contentUrl: absoluteUrl(item.imageUrl),
      name: item.name,
      description: item.description,
      datePublished: item.datePublished,
      width: item.width,
      height: item.height,
    };

    if (item.authorName) {
      image.author = { "@type": "Person", name: item.authorName };
    }

    return image;
  });

  const result: JsonLdObject = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: options.name,
    description: options.description,
    url: absoluteUrl(localizedPath(options.locale, options.path)),
    inLanguage: options.locale,
    image: images,
  };

  return result;
}

export type { ImageGalleryItem, JsonLdObject };
