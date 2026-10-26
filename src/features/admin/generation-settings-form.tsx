"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type { GenerationSettingsConfig } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import { Advanced, Affix, Field, FormCard, SwitchRow } from "./admin-form";
import workspace from "./admin-workspace.module.css";

type GenerationSettingsFormProps = {
  initialSettings: GenerationSettingsConfig;
};

type LimitField = "image" | "video";

type FormState = {
  image: string;
  video: string;
  isAutoRetry: boolean;
  maxRetries: string;
  isReadTimeoutRetry: boolean;
};

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

// 重试字段缺失时使用 Java 默认值
function readForm(settings: GenerationSettingsConfig): FormState {
  return {
    image: String(settings.maxActiveImageTasksPerUser),
    video: String(settings.maxActiveVideoTasksPerUser),
    isAutoRetry: settings.autoRetryEnabled ?? true,
    maxRetries: String(settings.maxRetries ?? 3),
    isReadTimeoutRetry: settings.retryOnImageReadTimeout ?? false,
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
  const hasEmptyRetries = !form.maxRetries.trim();

  function updateForm(nextForm: Partial<FormState>) {
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
      const nextSettings = await adminSettingsApi.saveGeneration({
        maxActiveImageTasksPerUser: Number(form.image),
        maxActiveVideoTasksPerUser: Number(form.video),
        autoRetryEnabled: form.isAutoRetry,
        maxRetries: Number(form.maxRetries),
        retryOnImageReadTimeout: form.isReadTimeoutRetry,
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
      canSave={!hasEmptyLimit && !hasEmptyRetries}
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
                onChange={(event) => updateForm({ [input.field]: event.target.value })}
              />
            </Affix>
          </Field>
        ))}
      </div>

      <div className={workspace.switchList}>
        <SwitchRow
          label="自动重试"
          checked={form.isAutoRetry}
          onChange={(nextChecked) => updateForm({ isAutoRetry: nextChecked })}
        />
      </div>

      <div className={workspace.formGrid}>
        <Field label="最大重试次数" hint="0 – 5，仅对超时、限流、5xx、空结果等临时错误重试">
          <Affix suffix="次">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={5}
              step={1}
              value={form.maxRetries}
              disabled={!form.isAutoRetry}
              onChange={(event) => updateForm({ maxRetries: event.target.value })}
            />
          </Affix>
        </Field>
      </div>

      <Advanced id="generation">
        <div className={workspace.switchList}>
          <SwitchRow
            label="图片读取超时也重试"
            hint="可能导致上游重复计费"
            checked={form.isReadTimeoutRetry}
            disabled={!form.isAutoRetry}
            onChange={(nextChecked) => updateForm({ isReadTimeoutRetry: nextChecked })}
          />
        </div>
        <div className={workspace.formGrid}>
          <Field
            label="服务器图片并发"
            hint="0 表示不限制，由 GENERATION_IMAGE_CONCURRENCY 配置"
            isGroup
          >
            <span className={workspace.readonlyValue}>{settings.imageConcurrency || "不限制"}</span>
          </Field>
          <Field
            label="服务器视频并发"
            hint="0 表示不限制，由 GENERATION_VIDEO_CONCURRENCY 配置"
            isGroup
          >
            <span className={workspace.readonlyValue}>{settings.videoConcurrency || "不限制"}</span>
          </Field>
        </div>
      </Advanced>
    </FormCard>
  );
}
