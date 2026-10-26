"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import styles from "./docs.module.css";

type DocsTocGroup = {
  title: string;
  items: Array<{ id: string; title: string }>;
};

type DocsMobileTocProps = {
  groups: DocsTocGroup[];
};

/** 手机端文档目录：吸顶的下拉面板，点选条目后自动收起。 */
export function DocsMobileToc(props: DocsMobileTocProps) {
  const t = useTranslations("docs");
  const detailsRef = useRef<HTMLDetailsElement>(null);

  if (props.groups.length === 0) {
    return null;
  }

  return (
    <details ref={detailsRef} className={styles.docs__mobileToc}>
      <summary className={styles.docs__mobileTocSummary}>
        <span>{t("toc")}</span>
        <ChevronDown size={16} aria-hidden className={styles.docs__mobileTocIcon} />
      </summary>
      <nav className={styles.docs__mobileTocPanel} aria-label={t("tocLabel")}>
        {props.groups.map((group) => (
          <section key={group.title}>
            <h2 className={styles.docs__navGroupTitle}>{group.title}</h2>
            <div className={styles.docs__mobileTocItems}>
              {group.items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={styles.docs__mobileTocLink}
                  onClick={() => {
                    if (detailsRef.current) detailsRef.current.open = false;
                  }}
                >
                  {item.title}
                </a>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </details>
  );
}
