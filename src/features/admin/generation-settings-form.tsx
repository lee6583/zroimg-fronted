"use client";

import { getErrorMessage } from "@/utils/error";
import { useState, type FormEvent } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type { GenerationProviderAdminConfig } from "@/types/admin";
import styles from "./admin-forms.module.css";

const sourceLabels: Record<GenerationProviderAdminConfig["apiKeySource"], string> = {
  database: "后台数据库",
  env: ".env 兜底",
  none: "未配置",
};

export function GenerationSettingsForm({
  initialSettings,
}: {
  initialSettings: GenerationProviderAdminConfig;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [isEnabled, setEnabled] = useState(initialSettings.enabled);
  const [baseUrl, setBaseUrl] = useState(initialSettings.baseUrl ?? "");
  const [model, setModel] = useState(initialSettings.model);
  const [apiKey, setApiKey] = useState("");
  const [shouldClearKey, setClearKey] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const data = await adminSettingsApi.saveGenerationSettings({
        enabled: isEnabled,
        baseUrl,
        model,
        apiKey,
        clearApiKey: shouldClearKey,
      });
      setSaving(false);
      setSettings(data.settings);
      setApiKey("");
      setClearKey(false);
      setMessage("已保存，新的生成任务会使用这套配置。");
    } catch (error) {
      setSaving(false);
      setMessage(getErrorMessage(error));
      return;
    }
  }

  return (
    <form className="surface mt-6 grid gap-5 rounded-md p-5" onSubmit={saveSettings}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label">Provider</p>
          <h2 className="text-2xl font-black">生图服务配置</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            支持 OpenAI Images API 或兼容 OpenAI SDK 的中转地址。前端不会拿到密钥，worker
            执行任务时从服务端读取。
          </p>
        </div>
        <label className={styles.adminForms__enablePill}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          启用生图
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">API Base URL</span>
          <input
            className="field"
            placeholder="留空使用 OpenAI SDK 默认地址，或填 https://your-gateway.example.com/v1"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
          />
          <span className="text-xs text-muted">
            如果你用第三方网关/自建代理，通常填到 `/v1` 这一层。
          </span>
        </label>

        <label className="grid gap-2">
          <span className="label">模型名</span>
          <input
            className="field"
            value={model}
            onChange={(event) => setModel(event.target.value)}
          />
          <span className="text-xs text-muted">
            例如 `gpt-image-2`。任务创建时会把当时的模型名写入任务记录。
          </span>
        </label>
      </div>

      <label className="grid gap-2">
        <span className="label">API Key</span>
        <input
          className="field"
          type="password"
          autoComplete="new-password"
          placeholder={settings.hasApiKey ? "留空表示保留当前密钥" : "请输入生图服务密钥"}
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          disabled={shouldClearKey}
        />
        <span className="text-xs text-muted">
          当前状态：
          {settings.hasApiKey
            ? `已配置（${settings.apiKeyPreview}，来源：${sourceLabels[settings.apiKeySource]}）`
            : "未配置"}
        </span>
      </label>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={shouldClearKey}
          onChange={(event) => setClearKey(event.target.checked)}
        />
        清空数据库里保存的密钥
      </label>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button className="btn-primary w-full md:w-fit" disabled={isSaving || !model.trim()}>
        {isSaving ? "保存中" : "保存配置"}
      </button>
    </form>
  );
}
