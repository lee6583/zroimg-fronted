"use client";

import { getErrorMessage } from "@/utils/error";
import { useState, type FormEvent } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type { AnnouncementSettingsConfig } from "@/types/announcement";
import styles from "./admin-forms.module.css";

type AnnouncementSettingsFormProps = {
  initialSettings: AnnouncementSettingsConfig;
};

export function AnnouncementSettingsForm(props: AnnouncementSettingsFormProps) {
  const initialSettings = props.initialSettings;

  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState({
    isEnabled: initialSettings.enabled,
    title: initialSettings.title,
    content: initialSettings.content,
  });
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  function updateForm(nextForm: Partial<typeof form>) {
    setForm((currentForm) => {
      return {
        ...currentForm,
        ...nextForm,
      };
    });
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const data = await adminSettingsApi.saveAnnouncementSettings({
        enabled: form.isEnabled,
        title: form.title,
        content: form.content,
      });
      setSettings(data.settings);
      setMessage("公告设置已保存。");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.adminForms__form} onSubmit={saveSettings}>
      <div className={styles.adminForms__header}>
        <div>
          <h2 className={styles.adminForms__title}>站内公告设置</h2>
        </div>
        <span className="rounded-md bg-soft px-3 py-2 text-xs font-medium text-muted">
          {settings.enabled ? "已启用" : "已停用"}
        </span>
      </div>

      <label className="grid gap-2">
        <span className="label">公告标题</span>
        <input
          className="field"
          value={form.title}
          onChange={(event) => updateForm({ title: event.target.value })}
          maxLength={60}
          placeholder="例如：系统维护通知"
        />
      </label>

      <label className="grid gap-2">
        <span className="label">公告内容</span>
        <textarea
          className="field min-h-36 resize-none py-3 leading-6"
          value={form.content}
          onChange={(event) => updateForm({ content: event.target.value })}
          maxLength={2000}
          placeholder="请输入需要展示给用户的公告内容"
        />
      </label>

      <button
        type="button"
        onClick={() => updateForm({ isEnabled: !form.isEnabled })}
        className={styles.adminForms__toggle}
      >
        <span>
          <span className={styles.adminForms__toggleLabel}>启用公告</span>
          <span className={styles.adminForms__toggleDescription}>
            关闭后顶部铃铛仍可打开公告入口，但不会登录后自动弹出。
          </span>
        </span>
        <span
          className={
            form.isEnabled
              ? `${styles.adminForms__switch} ${styles.adminForms__switchChecked}`
              : styles.adminForms__switch
          }
          aria-hidden="true"
        >
          <span
            className={
              form.isEnabled
                ? `${styles.adminForms__switchThumb} ${styles.adminForms__switchThumbChecked}`
                : styles.adminForms__switchThumb
            }
          />
        </span>
      </button>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button
        className="btn-primary w-full md:w-fit"
        disabled={isSaving || !form.title.trim() || !form.content.trim()}
      >
        {isSaving ? "保存中" : "保存公告设置"}
      </button>
    </form>
  );
}
