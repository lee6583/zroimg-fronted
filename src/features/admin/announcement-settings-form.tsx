"use client";

import { getErrorMessage } from "@/utils/error";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type { AnnouncementSettingsConfig } from "@/types/admin";
import { Field, FormCard, SwitchRow } from "./admin-form";
import workspace from "./admin-workspace.module.css";

type AnnouncementSettingsFormProps = {
  initialSettings: AnnouncementSettingsConfig;
};

export function AnnouncementSettingsForm(props: AnnouncementSettingsFormProps) {
  const initialSettings = props.initialSettings;

  const router = useRouter();
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

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    try {
      await adminSettingsApi.saveAnnouncement({
        enabled: form.isEnabled,
        title: form.title,
        content: form.content,
      });
      setMessage("已保存");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormCard
      title="站内公告"
      message={message}
      saveLabel="保存"
      isSaving={isSaving}
      canSave={Boolean(form.title.trim() && form.content.trim())}
      onSubmit={saveSettings}
    >
      <div className={workspace.switchList}>
        <SwitchRow
          label="启用公告"
          hint="关闭后不会在登录后自动弹出，铃铛入口仍可查看"
          checked={form.isEnabled}
          onChange={(isEnabled) => updateForm({ isEnabled })}
        />
      </div>

      <div className={workspace.formGrid}>
        <Field label="公告标题" hint="最多 60 字" isFull>
          <input
            className={workspace.formField}
            value={form.title}
            onChange={(event) => updateForm({ title: event.target.value })}
            maxLength={60}
            placeholder="例如：系统维护通知"
          />
        </Field>
        <Field label="公告内容" hint="最多 2000 字" isFull>
          <textarea
            className={workspace.formTextarea}
            rows={8}
            value={form.content}
            onChange={(event) => updateForm({ content: event.target.value })}
            maxLength={2000}
          />
        </Field>
      </div>
    </FormCard>
  );
}
