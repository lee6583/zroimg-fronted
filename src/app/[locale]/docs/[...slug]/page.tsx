import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";
import { getDocsNeighbors, getDocsPage } from "@/content/docs";
import { docsSections, isDocsSlug } from "@/content/docs/navigation";
import type { DocsSlug } from "@/content/docs/types";
import { DocsArticle } from "@/features/docs/docs-article";
import { renderMarkdown } from "@/features/docs/markdown";
import { buildMetadata } from "@/lib/seo";
import { techArticle } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

type DocsPageProps = PageProps<"/[locale]/docs/[...slug]">;

async function readSlug(props: DocsPageProps): Promise<DocsSlug> {
  const params = await props.params;
  const slug = params.slug.join("/");
  if (!isDocsSlug(slug)) {
    notFound();
  }

  return slug;
}

export async function generateMetadata(props: DocsPageProps): Promise<Metadata> {
  const slug = await readSlug(props);
  const locale = await getLocale();
  const page = getDocsPage(locale, slug);

  return buildMetadata({
    locale,
    path: `/docs/${slug}`,
    title: page.title,
    description: page.description,
  });
}

export default async function DocsPage(props: DocsPageProps) {
  const slug = await readSlug(props);
  const locale = await getLocale();
  const t = await getTranslations("docs");
  const page = getDocsPage(locale, slug);
  const neighbors = getDocsNeighbors(locale, slug);
  const rendered = renderMarkdown(page.body);

  const section = docsSections.find((item) => item.slugs.includes(slug));
  let eyebrow = t("overview.navTitle");
  if (section) {
    eyebrow = t(`sections.${section.key}`);
  }

  return (
    <DocsArticle
      eyebrow={eyebrow}
      title={page.title}
      description={page.description}
      headings={rendered.headings}
      previous={neighbors.previous}
      next={neighbors.next}
    >
      <JsonLd
        data={techArticle({
          locale,
          path: `/docs/${slug}`,
          headline: page.title,
          description: page.description,
        })}
      />
      {rendered.nodes}
    </DocsArticle>
  );
}
