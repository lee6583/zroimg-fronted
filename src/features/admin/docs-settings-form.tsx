"use client";

import { Braces, CircleCheck, RotateCcw, Save } from "lucide-react";
import { getErrorMessage } from "@/utils/error";
import { useState, type FormEvent } from "react";
import { adminDocsApi } from "@/api/admin/docs";
import type { DocsConfig } from "@/types/content";
import styles from "./docs-settings-form.module.css";

type DocsSettingsFormProps = {
  initialDocs: DocsConfig;
  defaultDocs: DocsConfig;
};

function readStructureStats(value: string) {
  try {
    const groups = JSON.parse(value) as unknown;
    if (!Array.isArray(groups)) return { valid: false, groups: 0, items: 0 };

    const items = groups.reduce((total, group) => {
      if (!group || typeof group !== "object" || !("items" in group)) return total;
      const groupItems = (group as { items?: unknown }).items;
      return total + (Array.isArray(groupItems) ? groupItems.length : 0);
    }, 0);

    return { valid: true, groups: groups.length, items };
  } catch {
    return { valid: false, groups: 0, items: 0 };
  }
}

export function DocsSettingsForm(props: DocsSettingsFormProps) {
  const initialDocs = props.initialDocs;
  const defaultDocs = props.defaultDocs;

  const [title, setTitle] = useState(initialDocs.title);
  const [description, setDescription] = useState(initialDocs.description);
  const [groupsJson, setGroupsJson] = useState(JSON.stringify(initialDocs.groups, null, 2));
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);
  const structureStats = readStructureStats(groupsJson);

  function useDefaultDocs() {
    setTitle(defaultDocs.title);
    setDescription(defaultDocs.description);
    setGroupsJson(JSON.stringify(defaultDocs.groups, null, 2));
    setMessage("已填入默认文档模板，保存后才会生效。");
  }

  async function saveDocs(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    let groups: unknown;
    try {
      groups = JSON.parse(groupsJson);
    } catch {
      setSaving(false);
      setMessage("文档结构 JSON 格式不正确，请检查逗号、引号和括号。");
      return;
    }

    try {
      const data = await adminDocsApi.saveDocsConfig({
        title,
        description,
        groups,
      });

      setSaving(false);
      setTitle(data.docs.title);
      setDescription(data.docs.description);
      setGroupsJson(JSON.stringify(data.docs.groups, null, 2));
      setMessage("文档已保存，前台 /docs 会立即读取最新内容。");
    } catch (error) {
      setSaving(false);
      setMessage(getErrorMessage(error));
      return;
    }
  }

  return (
    <form className={styles.editor} onSubmit={saveDocs}>
      <header className={styles.toolbar}>
        <div>
          <h2 className={styles.toolbarTitle}>公开文档内容</h2>
          <p className={styles.toolbarHint}>保存后，前台文档页会立即读取最新版本</p>
        </div>
        <button className={styles.secondaryButton} type="button" onClick={useDefaultDocs}>
          <RotateCcw size={14} aria-hidden="true" />
          使用默认模板
        </button>
      </header>

      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>页面信息</h3>
            <label className={styles.field}>
              <span className={styles.label}>页面标题</span>
              <input
                className={styles.input}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>页面简介</span>
              <textarea
                className={styles.textarea}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>结构摘要</h3>
            <div className={styles.summary}>
              <div className={styles.summaryItem}>
                <span>文档分组</span>
                <strong>{structureStats.groups}</strong>
              </div>
              <div className={styles.summaryItem}>
                <span>文档条目</span>
                <strong>{structureStats.items}</strong>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>结构规则</h3>
            <div className={styles.rules}>
              <p className={styles.rule}>
                <CircleCheck size={13} aria-hidden="true" />
                <span>每个分组需要 `title` 和 `items`。</span>
              </p>
              <p className={styles.rule}>
                <CircleCheck size={13} aria-hidden="true" />
                <span>每篇文档需要 `id`、`title` 和 `body`。</span>
              </p>
              <p className={styles.rule}>
                <CircleCheck size={13} aria-hidden="true" />
                <span>正文支持标题、列表、引用和代码块。</span>
              </p>
            </div>
          </section>
        </aside>

        <section className={styles.editorPane}>
          <header className={styles.editorPaneHeader}>
            <h3 className={styles.editorPaneTitle}>
              <Braces size={14} aria-hidden="true" />
              文档结构 JSON
            </h3>
            <span className={structureStats.valid ? styles.valid : styles.invalid}>
              {structureStats.valid ? "JSON 格式有效" : "JSON 格式待修正"}
            </span>
          </header>
          <textarea
            className={styles.jsonEditor}
            value={groupsJson}
            onChange={(event) => setGroupsJson(event.target.value)}
            spellCheck={false}
            aria-label="文档结构 JSON"
          />
        </section>
      </div>

      <footer className={styles.footer}>
        <p className={styles.message}>{message || "请在保存前确认 JSON 格式和文档锚点。"}</p>
        <button className={styles.primaryButton} disabled={isSaving || !structureStats.valid}>
          <Save size={14} aria-hidden="true" />
          {isSaving ? "保存中" : "保存文档"}
        </button>
      </footer>
    </form>
  );
}
