"use client";

import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import styles from "./markdown.module.css";
import { useCopy } from "./use-copy";

type CodeBlockProps = {
  code: string;
  language: string;
};

type CopyButtonProps = {
  text: string;
};

export function CopyButton(props: CopyButtonProps) {
  const t = useTranslations("docs.code");
  const copier = useCopy();
  let label = t("copy");
  if (copier.isCopied) {
    label = t("copied");
  }

  return (
    <button
      type="button"
      className={styles.markdown__copy}
      onClick={() => void copier.copy(props.text)}
      aria-label={label}
      title={label}
    >
      {copier.isCopied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
      <span aria-live="polite">{label}</span>
    </button>
  );
}

/** 单语言代码块：顶部显示语言和复制按钮。 */
export function CodeBlock(props: CodeBlockProps) {
  return (
    <div className={styles.markdown__codeBlock}>
      <div className={styles.markdown__codeHeader}>
        <span className={styles.markdown__codeLanguage}>{props.language}</span>
        <CopyButton text={props.code} />
      </div>
      <pre className={styles.markdown__pre}>
        <code>{props.code}</code>
      </pre>
    </div>
  );
}
