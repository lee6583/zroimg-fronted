import clsx from "clsx";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { DocsMobileToc } from "./docs-mobile-toc";
import type { MarkdownHeading } from "./markdown";
import styles from "./docs.module.css";

type DocsPagerLink = {
  href: string;
  title: string;
};

type DocsArticleProps = {
  eyebrow: string;
  title: string;
  description: string;
  headings: MarkdownHeading[];
  previous?: DocsPagerLink | null;
  next?: DocsPagerLink | null;
  children: ReactNode;
};

/** 文档页面骨架：标题、导语、窄屏目录、正文、上一页/下一页和桌面右侧目录。 */
export async function DocsArticle(props: DocsArticleProps) {
  const t = await getTranslations("docs");
  const headings = props.headings;
  const previous = props.previous ?? null;
  const next = props.next ?? null;
  const hasPager = Boolean(previous || next);

  return (
    <div className={styles.docs__page}>
      <article className={styles.docs__article}>
        <header className={styles.docs__header}>
          <p className={styles.docs__eyebrow}>{props.eyebrow}</p>
          <h1 className={styles.docs__title}>{props.title}</h1>
          <p className={styles.docs__lead}>{props.description}</p>
        </header>

        <DocsMobileToc headings={headings} />

        <div className={styles.docs__body}>{props.children}</div>

        {hasPager ? (
          <nav className={styles.docs__pager} aria-label={t("pager.label")}>
            {previous ? (
              <Link href={previous.href} className={styles.docs__pagerLink}>
                <span className={styles.docs__pagerHint}>
                  <ArrowLeft size={14} aria-hidden />
                  {t("pager.previous")}
                </span>
                <span className={styles.docs__pagerTitle}>{previous.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={next.href}
                className={clsx(styles.docs__pagerLink, styles.docs__pagerLinkNext)}
              >
                <span className={styles.docs__pagerHint}>
                  {t("pager.next")}
                  <ArrowRight size={14} aria-hidden />
                </span>
                <span className={styles.docs__pagerTitle}>{next.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}
      </article>

      {headings.length > 0 ? (
        <aside className={styles.docs__toc}>
          <nav aria-label={t("tocLabel")}>
            <p className={styles.docs__tocTitle}>{t("toc")}</p>
            <div className={styles.docs__tocItems}>
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className={clsx(
                    styles.docs__tocLink,
                    heading.level === 3 && styles.docs__tocLinkNested,
                  )}
                >
                  {heading.title}
                </a>
              ))}
            </div>
          </nav>
        </aside>
      ) : null}
    </div>
  );
}
