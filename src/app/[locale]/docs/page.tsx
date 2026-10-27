import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/components/seo/json-ld";
import { getDocsContent } from "@/content/docs";
import { docsSections } from "@/content/docs/navigation";
import { DocsArticle } from "@/features/docs/docs-article";
import { renderMarkdown, type MarkdownHeading } from "@/features/docs/markdown";
import styles from "@/features/docs/docs.module.css";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo";
import { techArticle } from "@/lib/structured-data";
import { requestJava } from "@/server/java-api";
import type { DocsConfig } from "@/types/content";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata.docs");

  return buildMetadata({
    locale,
    path: "/docs",
    title: t("title"),
    description: t("description"),
  });
}

export default async function DocsOverviewPage() {
  const locale = await getLocale();
  const t = await getTranslations("docs");
  const content = getDocsContent(locale);

  // 后台「文档管理」维护的公告与常见问题；未保存时 Java 返回空对象 {}，原样展示（不翻译）。
  const adminDocs = await requestJava<Partial<DocsConfig>>("/content/public/docs");
  const adminGroups = (adminDocs.groups ?? []).filter((group) => group.items.length > 0);
  const hasNotices = adminGroups.length > 0;

  // 第一步：内置文档的分区目录。
  const headings: MarkdownHeading[] = docsSections.map((section) => {
    const heading: MarkdownHeading = {
      id: section.key,
      title: t(`sections.${section.key}`),
      level: 2,
    };

    return heading;
  });

  // 第二步：后台文档逐篇渲染，标题降一级，锚点加前缀避免与内置分区冲突。
  const notices = adminGroups.map((group) => {
    const items = group.items.map((item) => {
      const rendered = renderMarkdown(item.body, {
        idPrefix: `notice-${item.id}-`,
        shiftHeadings: true,
      });

      return { id: item.id, title: item.title, nodes: rendered.nodes };
    });

    return { title: group.title, items };
  });

  if (hasNotices) {
    headings.push({ id: "notices", title: t("notices.title"), level: 2 });
    for (const group of notices) {
      for (const item of group.items) {
        headings.push({ id: `notice-${item.id}`, title: item.title, level: 3 });
      }
    }
  }

  return (
    <DocsArticle
      eyebrow={t("overview.eyebrow")}
      title={t("overview.title")}
      description={t("overview.description")}
      headings={headings}
      next={{ href: "/docs/introduction", title: content.introduction.navTitle }}
    >
      <JsonLd
        data={techArticle({
          locale,
          path: "/docs",
          headline: t("overview.title"),
          description: t("overview.description"),
        })}
      />

      {docsSections.map((section) => (
        <section key={section.key}>
          <h2 id={section.key} className={styles.docs__sectionTitle}>
            {t(`sections.${section.key}`)}
          </h2>
          <p className={styles.docs__sectionText}>{t(`sectionDescriptions.${section.key}`)}</p>
          <div className={styles.docs__cards}>
            {section.slugs.map((slug) => (
              <Link key={slug} href={`/docs/${slug}`} className={styles.docs__card}>
                <span className={styles.docs__cardTitle}>
                  {content[slug].navTitle}
                  <ArrowRight size={15} aria-hidden className={styles.docs__cardIcon} />
                </span>
                <span className={styles.docs__cardText}>{content[slug].description}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {hasNotices ? (
        <section className={styles.docs__notice}>
          <h2 id="notices" className={styles.docs__sectionTitle}>
            {t("notices.title")}
          </h2>
          <p className={styles.docs__sectionText}>{t("notices.description")}</p>
          {notices.map((group) => (
            <div key={group.title} className={styles.docs__noticeGroup}>
              {group.items.map((item) => (
                <article key={item.id} className={styles.docs__noticeArticle}>
                  <h3 id={`notice-${item.id}`} className={styles.docs__noticeTitle}>
                    {item.title}
                  </h3>
                  {item.nodes}
                </article>
              ))}
            </div>
          ))}
        </section>
      ) : null}
    </DocsArticle>
  );
}
