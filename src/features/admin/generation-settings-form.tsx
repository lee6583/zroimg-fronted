"use client";

import { useState, type FormEvent } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type { GenerationSettingsConfig } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import styles from "./admin-forms.module.css";

type GenerationSettingsFormProps = {
  initialSettings: GenerationSettingsConfig;
};

type LimitField = "image" | "video";

type LimitInput = {
  field: LimitField;
  label: string;
  min: number;
  max: number;
};

const limitInputs: LimitInput[] = [
  { field: "image", label: "每位用户同时进行的图片任务", min: 1, max: 50 },
  { field: "video", label: "每位用户同时进行的视频任务", min: 1, max: 20 },
];

function readForm(settings: GenerationSettingsConfig) {
  return {
    image: String(settings.maxActiveImageTasksPerUser),
    video: String(settings.maxActiveVideoTasksPerUser),
  };
}

export function GenerationSettingsForm(props: GenerationSettingsFormProps) {
  const initialSettings = props.initialSettings;

  const [form, setForm] = useState(() => readForm(initialSettings));
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  const hasEmptyLimit = limitInputs.some((input) => !form[input.field].trim());

  function updateField(field: LimitField, value: string) {
    setForm((currentForm) => {
      return {
        ...currentForm,
        [field]: value,
      };
    });
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const nextSettings = await adminSettingsApi.saveGeneration({
        maxActiveImageTasksPerUser: Number(form.image),
        maxActiveVideoTasksPerUser: Number(form.video),
      });
      setForm(readForm(nextSettings));
      setSettings(nextSettings);
      setMessage("生成并发设置已保存。");
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
          <h2 className={styles.adminForms__title}>生成并发设置</h2>
        </div>
      </div>

      <section className={styles.adminForms__section}>
        <h3 className={styles.adminForms__sectionTitle}>用户并发上限</h3>
        <div className={styles.adminForms__fieldGrid}>
          {limitInputs.map((input) => (
            <label key={input.field} className="grid gap-2">
              <span className="label">{input.label}</span>
              <span className={styles.adminForms__inputWithUnit}>
                <input
                  className="field"
                  type="number"
                  inputMode="numeric"
                  min={input.min}
                  max={input.max}
                  step={1}
                  value={form[input.field]}
                  onChange={(event) => updateField(input.field, event.target.value)}
                />
                <span className={styles.adminForms__unit}>个</span>
              </span>
              <span className="text-xs text-muted">
                {input.min} - {input.max}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className={styles.adminForms__section}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm">
            服务器并发：图片 {settings.imageConcurrency} / 视频 {settings.videoConcurrency}
          </span>
          <span className="text-xs text-muted">
            通过服务器配置 GENERATION_IMAGE_CONCURRENCY / GENERATION_VIDEO_CONCURRENCY 修改
          </span>
        </div>
      </section>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button className="btn-primary w-full md:w-fit" disabled={isSaving || hasEmptyLimit}>
        {isSaving ? "保存中" : "保存生成并发设置"}
      </button>
    </form>
  );
}
