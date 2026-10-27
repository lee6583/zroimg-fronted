"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useId, useSyncExternalStore } from "react";
import { codeLanguages, type CodeExample, type CodeLanguage } from "@/content/docs/examples";
import { CopyButton } from "./code-block";
import styles from "./markdown.module.css";

type CodeTabsProps = {
  example: CodeExample;
};

// 同一页面所有示例共用一个语言选择，并记住上次的选择。
const storageKey = "zroimg-docs-code-language";
const listeners = new Set<() => void>();

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function readLanguage(): string {
  return window.localStorage.getItem(storageKey) ?? "";
}

function readServerLanguage(): string {
  return "";
}

function chooseLanguage(language: CodeLanguage) {
  window.localStorage.setItem(storageKey, language);
  for (const listener of listeners) {
    listener();
  }
}

export function CodeTabs(props: CodeTabsProps) {
  const example = props.example;
  const t = useTranslations("docs.code");
  const baseId = useId();
  const stored = useSyncExternalStore(subscribe, readLanguage, readServerLanguage);

  // 第一步：示例实际提供的语言。
  const languages = codeLanguages.filter((language) => Boolean(example[language]));

  // 第二步：用户选过且本示例有的语言，否则用第一个。
  let active = languages[0] ?? "curl";
  const storedLanguage = languages.find((language) => language === stored);
  if (storedLanguage) {
    active = storedLanguage;
  }
  const code = example[active] ?? "";

  return (
    <div className={styles.markdown__codeBlock}>
      <div className={styles.markdown__codeHeader}>
        <div className={styles.markdown__tabs} role="tablist" aria-label={t("languages")}>
          {languages.map((language) => (
            <button
              key={language}
              type="button"
              role="tab"
              id={`${baseId}-${language}`}
              aria-selected={language === active}
              aria-controls={`${baseId}-panel`}
              className={clsx(
                styles.markdown__tab,
                language === active && styles.markdown__tabActive,
              )}
              onClick={() => chooseLanguage(language)}
            >
              {t(`language.${language}`)}
            </button>
          ))}
        </div>
        <CopyButton text={code} />
      </div>
      <pre
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-${active}`}
        className={styles.markdown__pre}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}
