"use client";

import { useState, type FormEvent } from "react";
import type { DocsConfig } from "@/server/docs";

export function DocsSettingsForm({
  initialDocs,
  defaultDocs,
}: {
  initialDocs: DocsConfig;
  defaultDocs: DocsConfig;
}) {
  const [title, setTitle] = useState(initialDocs.title);
  const [description, setDescription] = useState(initialDocs.description);
  const [groupsJson, setGroupsJson] = useState(JSON.stringify(initialDocs.groups, null, 2));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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

    const response = await fetch("/api/admin/docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, groups }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setMessage(data.error || "保存失败");
      return;
    }

    setTitle(data.docs.title);
    setDescription(data.docs.description);
    setGroupsJson(JSON.stringify(data.docs.groups, null, 2));
    setMessage("文档已保存，前台 /docs 会立即读取最新内容。");
  }

  return (
    <form className="surface grid gap-5 rounded-xl p-5" onSubmit={saveDocs}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="label">Docs content</p>
          <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight">编辑公开文档</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            文档页左侧导航来自分组和条目标题，右侧正文支持简单 Markdown：标题、列表、数字步骤、引用提示和代码块。
          </p>
        </div>
        <button className="btn-secondary" type="button" onClick={useDefaultDocs}>
          使用默认模板
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">页面标题</span>
          <input className="field" value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="grid gap-2">
          <span className="label">页面简介</span>
          <input className="field" value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
      </div>

      <label className="grid gap-2">
        <span className="label">文档结构 JSON</span>
        <textarea
          className="field min-h-[520px] resize-y font-mono text-sm leading-6"
          value={groupsJson}
          onChange={(event) => setGroupsJson(event.target.value)}
          spellCheck={false}
        />
      </label>

      <div className="rounded-xl border border-line bg-soft p-4 text-sm leading-7 text-muted">
        <p className="font-medium text-foreground">结构示例</p>
        <p>
          每个分组需要 `title` 和 `items`；每个条目需要 `id`、`title`、`body`。`id` 会用于页面锚点，只能使用字母、数字和短横线。
        </p>
      </div>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button className="btn-primary w-full md:w-fit" disabled={saving}>
        {saving ? "保存中" : "保存文档"}
      </button>
    </form>
  );
}
