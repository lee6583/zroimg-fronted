import { Info, Lightbulb, TriangleAlert, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { codeExamples, isCodeExampleKey } from "@/content/docs/examples";
import { Link } from "@/i18n/navigation";
import { CodeBlock } from "./code-block";
import { CodeTabs } from "./code-tabs";
import styles from "./markdown.module.css";

// 文档用的轻量 Markdown 渲染器：内置文档和后台配置的文档都走这里。
// 支持的语法见 docs/docs-site.md；不支持 HTML，正文里的 < > 原样当文本输出。

type MarkdownHeading = {
  id: string;
  title: string;
  level: 2 | 3;
};

type MarkdownResult = {
  nodes: ReactNode[];
  headings: MarkdownHeading[];
};

type CalloutKind = "note" | "tip" | "warning";

const calloutIcons: Record<CalloutKind, LucideIcon> = {
  note: Info,
  tip: Lightbulb,
  warning: TriangleAlert,
};

const inlinePattern = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)\s]+\))/g;
const linkPattern = /^\[([^\]]+)\]\(([^)\s]+)\)$/;
const headingIdPattern = /\s*\{#([a-z0-9-]+)\}\s*$/;
const fencePattern = /^(```|~~~)\s*([\w-]*)\s*$/;
const calloutPattern = /^\[!(NOTE|TIP|WARNING)\]$/;
const tableSeparatorPattern = /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/;

function renderLink(text: string, href: string, key: string) {
  const isInternal = href.startsWith("/");
  if (isInternal) {
    return (
      <Link key={key} href={href} className={styles.markdown__link}>
        {text}
      </Link>
    );
  }

  const isHash = href.startsWith("#");
  if (isHash) {
    return (
      <a key={key} href={href} className={styles.markdown__link}>
        {text}
      </a>
    );
  }

  return (
    <a key={key} href={href} className={styles.markdown__link} target="_blank" rel="noreferrer">
      {text}
    </a>
  );
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(inlinePattern);

  return parts.map((part, index) => {
    const key = `${index}-${part}`;

    if (part.length > 1 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className={styles.markdown__codeInline}>
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }

    const link = linkPattern.exec(part);
    if (link) {
      return renderLink(link[1] ?? "", link[2] ?? "", key);
    }

    return part;
  });
}

/** 标题文字 -> 锚点：优先使用 `{#id}`，否则用 ASCII 字符生成，都没有时按序号。 */
function headingId(text: string, usedIds: Set<string>, fallbackIndex: number) {
  const explicit = headingIdPattern.exec(text);
  let id = "";

  if (explicit) {
    id = explicit[1] ?? "";
  } else {
    id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");
  }

  if (!id) {
    id = `section-${fallbackIndex}`;
  }

  let uniqueId = id;
  let suffix = 2;
  while (usedIds.has(uniqueId)) {
    uniqueId = `${id}-${suffix}`;
    suffix += 1;
  }
  usedIds.add(uniqueId);

  return uniqueId;
}

function splitTableRow(line: string) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  const cells = trimmed.split(/(?<!\\)\|/);

  return cells.map((cell) => cell.trim().replace(/\\\|/g, "|"));
}

type RenderMarkdownOptions = {
  // 给标题锚点加前缀，避免同一页面渲染多篇文档时 id 冲突。
  idPrefix?: string;
  // 后台文档的 `#` 一级标题降为 h2，保证页面只有一个 h1。
  shiftHeadings?: boolean;
};

export function renderMarkdown(body: string, options: RenderMarkdownOptions = {}): MarkdownResult {
  const idPrefix = options.idPrefix ?? "";
  const shouldShift = options.shiftHeadings ?? false;
  const lines = body.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  const headings: MarkdownHeading[] = [];
  const usedIds = new Set<string>();
  let index = 0;

  while (index < lines.length) {
    const line = lines[index]?.trimEnd() ?? "";
    const trimmed = line.trim();
    const key = `block-${index}`;

    if (!trimmed) {
      index += 1;
      continue;
    }

    // 代码块：``` 或 ~~~（TS 模板字符串里的正文用 ~~~，避免转义反引号）
    const fence = fencePattern.exec(trimmed);
    if (fence) {
      const marker = fence[1] ?? "```";
      const language = fence[2] ?? "";
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && lines[index]?.trim() !== marker) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }
      index += 1;
      nodes.push(<CodeBlock key={key} code={codeLines.join("\n")} language={language} />);
      continue;
    }

    // 多语言代码示例：::: example imagesSubmit
    if (trimmed.startsWith("::: example ")) {
      const exampleKey = trimmed.slice("::: example ".length).trim();
      if (isCodeExampleKey(exampleKey)) {
        nodes.push(<CodeTabs key={key} example={codeExamples[exampleKey]} />);
      }
      index += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      let level = heading[1]?.length ?? 2;
      const rawText = heading[2] ?? "";
      const text = rawText.replace(headingIdPattern, "");
      index += 1;

      if (shouldShift && level === 1) {
        level = 2;
      }

      if (level === 1) {
        nodes.push(
          <h1 key={key} className={styles.markdown__h1}>
            {renderInline(text)}
          </h1>,
        );
        continue;
      }

      const id = `${idPrefix}${headingId(rawText, usedIds, headings.length + 1)}`;
      const plainText = text.replace(/[`*]/g, "");
      if (level === 2) {
        headings.push({ id, title: plainText, level: 2 });
        nodes.push(
          <h2 key={key} id={id} className={styles.markdown__h2}>
            <a href={`#${id}`} className={styles.markdown__anchor}>
              {renderInline(text)}
            </a>
          </h2>,
        );
        continue;
      }

      headings.push({ id, title: plainText, level: 3 });
      nodes.push(
        <h3 key={key} id={id} className={styles.markdown__h3}>
          <a href={`#${id}`} className={styles.markdown__anchor}>
            {renderInline(text)}
          </a>
        </h3>,
      );
      continue;
    }

    // 引用块；首行是 [!NOTE] / [!TIP] / [!WARNING] 时渲染为提示框
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index]?.trim().startsWith(">")) {
        quoteLines.push((lines[index] ?? "").trim().replace(/^>\s?/, ""));
        index += 1;
      }

      const callout = calloutPattern.exec(quoteLines[0] ?? "");
      let kind: CalloutKind | null = null;
      if (callout) {
        kind = (callout[1] ?? "NOTE").toLowerCase() as CalloutKind;
        quoteLines.shift();
      }

      const paragraphs = quoteLines.filter((quote) => quote.trim() !== "");
      const content = paragraphs.map((quote, quoteIndex) => (
        <p key={`${quoteIndex}-${quote}`}>{renderInline(quote)}</p>
      ));

      if (!kind) {
        nodes.push(
          <blockquote key={key} className={styles.markdown__quote}>
            {content}
          </blockquote>,
        );
        continue;
      }

      const Icon = calloutIcons[kind];
      nodes.push(
        <div key={key} className={styles.markdown__callout} data-kind={kind}>
          <Icon size={16} aria-hidden className={styles.markdown__calloutIcon} />
          <div className={styles.markdown__calloutBody}>{content}</div>
        </div>,
      );
      continue;
    }

    // 表格：第二行必须是 | --- | --- | 分隔行
    const nextLine = lines[index + 1]?.trim() ?? "";
    if (trimmed.startsWith("|") && tableSeparatorPattern.test(nextLine)) {
      const header = splitTableRow(trimmed);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index]?.trim().startsWith("|")) {
        rows.push(splitTableRow(lines[index] ?? ""));
        index += 1;
      }

      nodes.push(
        <div key={key} className={styles.markdown__tableWrap}>
          <table className={styles.markdown__table}>
            <thead>
              <tr>
                {header.map((cell, cellIndex) => (
                  <th key={`${cellIndex}-${cell}`}>{renderInline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row[0]}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${cellIndex}-${cell}`} data-label={header[cellIndex] ?? ""}>
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
        <ul key={key} className={styles.markdown__list}>
          {items.map((item, itemIndex) => (
            <li key={`${itemIndex}-${item}`}>{renderInline(item)}</li>
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
        <ol key={key} className={styles.markdown__steps}>
          {items.map((item, itemIndex) => (
            <li key={`${itemIndex}-${item}`} className={styles.markdown__step}>
              <span className={styles.markdown__stepNumber} aria-hidden>
                {itemIndex + 1}
              </span>
              <p>{renderInline(item)}</p>
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // 段落：一行一段（和后台文档的既有写法一致）
    nodes.push(
      <p key={key} className={styles.markdown__paragraph}>
        {renderInline(trimmed)}
      </p>,
    );
    index += 1;
  }

  return { nodes, headings };
}

export type { MarkdownHeading };
