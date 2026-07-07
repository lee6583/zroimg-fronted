import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { MainNav } from "@/components/layout/main-nav";
import { getDocsConfig } from "@/server/bff/content";
import styles from "./docs.module.css";

export const dynamic = "force-dynamic";

function inlineCode(text: string) {
  return text.split(/(`[^`]+`)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={`${part}-${index}`} className={styles.docs__codeInline}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderMarkdown(body: string) {
  const lines = body.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trimEnd() ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index]?.trim().startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }
      index += 1;
      nodes.push(
        <pre key={`code-${index}`} className={styles.docs__codeBlock}>
          <code className={styles.docs__code} data-language={language || undefined}>
            {codeLines.join("\n")}
          </code>
        </pre>,
      );
      continue;
    }

    if (trimmed.startsWith("# ")) {
      nodes.push(
        <h1 key={`h1-${index}`} className={styles.docs__headingPrimary}>
          {inlineCode(trimmed.slice(2))}
        </h1>,
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      nodes.push(
        <h2 key={`h2-${index}`} className={styles.docs__headingSecondary}>
          {inlineCode(trimmed.slice(3))}
        </h2>,
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      nodes.push(
        <h3 key={`h3-${index}`} className={styles.docs__headingTertiary}>
          {inlineCode(trimmed.slice(4))}
        </h3>,
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index]?.trim().startsWith("> ")) {
        quoteLines.push((lines[index] ?? "").trim().slice(2));
        index += 1;
      }
      nodes.push(
        <div key={`quote-${index}`} className={styles.docs__quote}>
          {quoteLines.map((quote, quoteIndex) => (
            <p key={`${quote}-${quoteIndex}`}>{inlineCode(quote)}</p>
          ))}
        </div>,
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index]?.trim() ?? "")) {
        items.push((lines[index] ?? "").trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      nodes.push(
        <ul key={`ul-${index}`} className={styles.docs__list}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`} className={styles.docs__listItem}>
              <span className={styles.docs__listBullet} />
              <span>{inlineCode(item)}</span>
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index]?.trim() ?? "")) {
        items.push((lines[index] ?? "").trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      nodes.push(
        <ol key={`ol-${index}`} className={styles.docs__orderedList}>
          {items.map((item, itemIndex) => (
            <li key={`${item}-${itemIndex}`} className={styles.docs__orderedItem}>
              <span className={styles.docs__stepNumber}>{itemIndex + 1}</span>
              <p className={styles.docs__stepText}>{inlineCode(item)}</p>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    nodes.push(
      <p key={`p-${index}`} className={styles.docs__paragraph}>
        {inlineCode(trimmed)}
      </p>,
    );
    index += 1;
  }

  return nodes;
}

export default async function DocsPage() {
  const docs = await getDocsConfig();

  return (
    <>
      <MainNav />
      <main className={styles.docs}>
        <aside className={styles.docs__sidebar}>
          <div className={styles.docs__sidebarInner}>
            <nav className={styles.docs__nav}>
              {docs.groups.map((group) => (
                <section key={group.title}>
                  <div className={styles.docs__navGroupHeader}>
                    <h2 className={styles.docs__navGroupTitle}>{group.title}</h2>
                    <ChevronDown size={14} className={styles.docs__navGroupIcon} />
                  </div>
                  <div className={styles.docs__navItems}>
                    {group.items.map((item) => (
                      <Link key={item.id} href={`#${item.id}`} className={styles.docs__navLink}>
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </nav>
          </div>
        </aside>

        <section className={styles.docs__content}>
          <div className={styles.docs__contentInner}>
            {docs.groups.map((group) =>
              group.items.map((item) => (
                <article key={item.id} id={item.id} className={styles.docs__article}>
                  {renderMarkdown(item.body)}
                </article>
              )),
            )}
          </div>
        </section>
      </main>
    </>
  );
}
