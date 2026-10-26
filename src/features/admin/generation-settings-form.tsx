"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type { GenerationSettingsConfig } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import { Advanced, Affix, Field, FormCard } from "./admin-form";
import workspace from "./admin-workspace.module.css";

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

  const router = useRouter();
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

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    try {
      const nextSettings = await adminSettingsApi.saveGeneration({
        maxActiveImageTasksPerUser: Number(form.image),
        maxActiveVideoTasksPerUser: Number(form.video),
      });
      setForm(readForm(nextSettings));
      setSettings(nextSettings);
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
      title="生成并发"
      message={message}
      saveLabel="保存"
      isSaving={isSaving}
      canSave={!hasEmptyLimit}
      onSubmit={saveSettings}
    >
      <div className={workspace.formGrid}>
        {limitInputs.map((input) => (
          <Field key={input.field} label={input.label} hint={`${input.min} – ${input.max}`}>
            <Affix suffix="个任务">
              <input
                type="number"
                inputMode="numeric"
                min={input.min}
                max={input.max}
                step={1}
                value={form[input.field]}
                onChange={(event) => updateField(input.field, event.target.value)}
              />
            </Affix>
          </Field>
        ))}
      </div>

      <Advanced id="generation">
        <div className={workspace.formGrid}>
          <Field label="服务器图片并发" hint="由 GENERATION_IMAGE_CONCURRENCY 配置" isGroup>
            <span className={workspace.readonlyValue}>{settings.imageConcurrency}</span>
          </Field>
          <Field label="服务器视频并发" hint="由 GENERATION_VIDEO_CONCURRENCY 配置" isGroup>
            <span className={workspace.readonlyValue}>{settings.videoConcurrency}</span>
          </Field>
        </div>
      </Advanced>
    </FormCard>
  );
}
