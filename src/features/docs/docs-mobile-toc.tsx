"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import type { MarkdownHeading } from "./markdown";
import styles from "./docs.module.css";

type DocsMobileTocProps = {
  headings: MarkdownHeading[];
};

/** 窄屏（< 1280px）的本页目录：折叠面板，点选条目后自动收起。 */
export function DocsMobileToc(props: DocsMobileTocProps) {
  const t = useTranslations("docs");
  const detailsRef = useRef<HTMLDetailsElement>(null);

  if (props.headings.length === 0) {
    return null;
  }

  return (
    <details ref={detailsRef} className={styles.docs__mobileToc}>
      <summary className={styles.docs__mobileTocSummary}>
        <span>{t("toc")}</span>
        <ChevronDown size={16} aria-hidden className={styles.docs__mobileTocIcon} />
      </summary>
      <nav className={styles.docs__mobileTocPanel} aria-label={t("tocLabel")}>
        {props.headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={clsx(
              styles.docs__mobileTocLink,
              heading.level === 3 && styles.docs__tocLinkNested,
            )}
            onClick={() => {
              if (detailsRef.current) detailsRef.current.open = false;
            }}
          >
            {heading.title}
          </a>
        ))}
      </nav>
    </details>
  );
}
