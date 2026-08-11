"use client";

import { getErrorMessage } from "@/utils/error";
import { useState, type FormEvent } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type {
  CheckInSettingsConfig,
  EasyPayAdminConfig,
  SecretSource,
  SmtpAdminConfig,
  VideoProviderAdminConfig,
} from "@/types/admin";
import styles from "./admin-forms.module.css";

const sourceLabels: Record<SecretSource, string> = {
  database: "后台数据库",
  env: ".env 兜底",
  none: "未配置",
};

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
};

type SmtpSettingsFormProps = {
  initialSettings: SmtpAdminConfig;
};

type EasyPaySettingsFormProps = {
  initialSettings: EasyPayAdminConfig;
};

type CheckInSettingsFormProps = {
  initialSettings: CheckInSettingsConfig;
};

type VideoSettingsFormProps = {
  initialSettings: VideoProviderAdminConfig;
};

function Toggle(props: ToggleProps) {
  const checked = props.checked;
  const onChange = props.onChange;
  const label = props.label;
  const description = props.description;

  return (
    <button type="button" onClick={() => onChange(!checked)} className={styles.adminForms__toggle}>
      <span>
        <span className={styles.adminForms__toggleLabel}>{label}</span>
        <span className={styles.adminForms__toggleDescription}>{description}</span>
      </span>
      <span
        className={
          checked
            ? `${styles.adminForms__switch} ${styles.adminForms__switchChecked}`
            : styles.adminForms__switch
        }
      >
        <span
          className={
            checked
              ? `${styles.adminForms__switchThumb} ${styles.adminForms__switchThumbChecked}`
              : styles.adminForms__switchThumb
          }
        />
      </span>
    </button>
  );
}

export function SmtpSettingsForm(props: SmtpSettingsFormProps) {
  const initialSettings = props.initialSettings;

  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState({
    isEnabled: initialSettings.enabled,
    host: initialSettings.host ?? "",
    port: String(initialSettings.port),
    isSecure: initialSettings.secure,
    user: initialSettings.user ?? "",
    password: "",
    shouldClearPassword: false,
    from: initialSettings.from,
    testEmail: "",
  });
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [isTesting, setTesting] = useState(false);

  function updateForm(nextForm: Partial<typeof form>) {
    setForm((currentForm) => {
      const newForm = {
        ...currentForm,
        ...nextForm,
      };

      return newForm;
    });
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = await adminSettingsApi.saveSmtpSettings({
        enabled: form.isEnabled,
        host: form.host,
        port: Number(form.port),
        secure: form.isSecure,
        user: form.user,
        password: form.password,
        clearPassword: form.shouldClearPassword,
        from: form.from,
      });
      setSaving(false);
      setSettings(data.settings);
      updateForm({
        password: "",
        shouldClearPassword: false,
      });
      setMessage("SMTP 配置已保存。");
    } catch (error) {
      setSaving(false);
      setMessage(getErrorMessage(error));
      return;
    }
  }

  async function testSmtp(mode: "connection" | "email") {
    setTesting(true);
    setMessage("");
    try {
      await adminSettingsApi.testSmtpSettings(
        mode === "connection" ? { mode } : { mode, email: form.testEmail },
      );
      setTesting(false);
      setMessage(mode === "connection" ? "SMTP 连接测试通过。" : "测试邮件已发送。");
    } catch (error) {
      setTesting(false);
      setMessage(getErrorMessage(error));
      return;
    }
  }

  return (
    <form className={styles.adminForms__form} onSubmit={saveSettings}>
      <div className={styles.adminForms__header}>
        <div>
          <h2 className={styles.adminForms__title}>SMTP 邮件设置</h2>
        </div>
        <button
          className="btn-secondary"
          type="button"
          disabled={isTesting}
          onClick={() => testSmtp("connection")}
        >
          {isTesting ? "测试中" : "测试连接"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">SMTP 主机</span>
          <input
            className="field"
            value={form.host}
            onChange={(event) => updateForm({ host: event.target.value })}
            placeholder="smtp.qq.com"
          />
        </label>
        <label className="grid gap-2">
          <span className="label">SMTP 端口</span>
          <input
            className="field"
            inputMode="numeric"
            value={form.port}
            onChange={(event) => updateForm({ port: event.target.value })}
            placeholder="465"
          />
        </label>
        <label className="grid gap-2">
          <span className="label">SMTP 用户名</span>
          <input
            className="field"
            value={form.user}
            onChange={(event) => updateForm({ user: event.target.value })}
            placeholder="name@example.com"
          />
        </label>
        <label className="grid gap-2">
          <span className="label">SMTP 密码</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => updateForm({ password: event.target.value })}
            placeholder={settings.hasPassword ? "留空表示保留当前密码" : "请输入 SMTP 授权码或密码"}
            disabled={form.shouldClearPassword}
          />
          <span className="text-xs text-muted">
            当前状态：
            {settings.hasPassword
              ? `已配置（${settings.passwordPreview}，来源：${sourceLabels[settings.passwordSource]}）`
              : "未配置"}
          </span>
        </label>
        <label className="grid gap-2">
          <span className="label">发件人邮箱/名称</span>
          <input
            className="field"
            value={form.from}
            onChange={(event) => updateForm({ from: event.target.value })}
            placeholder="ZroImg <noreply@example.com>"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={form.shouldClearPassword}
          onChange={(event) => updateForm({ shouldClearPassword: event.target.checked })}
        />
        清空数据库里保存的 SMTP 密码
      </label>

      <Toggle
        checked={form.isSecure}
        onChange={(nextValue) => updateForm({ isSecure: nextValue })}
        label="使用 TLS"
        description="465 端口通常开启 TLS，587 端口通常使用 STARTTLS。"
      />
      <Toggle
        checked={form.isEnabled}
        onChange={(nextValue) => updateForm({ isEnabled: nextValue })}
        label="启用 SMTP"
        description="关闭后生产环境将无法发送注册验证码。"
      />

      <div className="grid gap-3 border-t border-line pt-5 md:grid-cols-[1fr_auto]">
        <input
          className="field"
          type="email"
          value={form.testEmail}
          onChange={(event) => updateForm({ testEmail: event.target.value })}
          placeholder="test@example.com"
        />
        <button
          className="btn-secondary"
          type="button"
          disabled={isTesting || !form.testEmail.trim()}
          onClick={() => testSmtp("email")}
        >
          发送测试邮件
        </button>
      </div>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button className="btn-primary w-full md:w-fit" disabled={isSaving}>
        {isSaving ? "保存中" : "保存 SMTP 设置"}
      </button>
    </form>
  );
}

export function VideoSettingsForm(props: VideoSettingsFormProps) {
  const initialSettings = props.initialSettings;
  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState({
    isEnabled: initialSettings.enabled,
    baseUrl: initialSettings.baseUrl ?? "",
    model: initialSettings.model,
    publicBaseUrl: initialSettings.publicBaseUrl ?? "",
    apiKey: "",
    shouldClearKey: false,
  });
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  function updateForm(nextForm: Partial<typeof form>) {
    setForm((currentForm) => {
      return { ...currentForm, ...nextForm };
    });
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = await adminSettingsApi.saveVideoSettings({
        enabled: form.isEnabled,
        baseUrl: form.baseUrl,
        model: form.model,
        publicBaseUrl: form.publicBaseUrl,
        apiKey: form.apiKey,
        clearApiKey: form.shouldClearKey,
      });
      setSettings(data.settings);
      updateForm({ apiKey: "", shouldClearKey: false });
      setMessage("视频 Provider 配置已保存。");
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
          <h2 className={styles.adminForms__title}>视频服务设置</h2>
        </div>
        <span className="rounded-md bg-soft px-3 py-2 text-xs font-medium text-muted">
          {form.isEnabled ? "已启用" : "已停用"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">Provider 地址</span>
          <input
            className="field"
            value={form.baseUrl}
            onChange={(event) => updateForm({ baseUrl: event.target.value })}
            placeholder="https://video.example.com"
          />
        </label>
        <label className="grid gap-2">
          <span className="label">模型名</span>
          <input
            className="field"
            value={form.model}
            onChange={(event) => updateForm({ model: event.target.value })}
            placeholder="video-generic"
          />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="label">视频公开地址前缀</span>
          <input
            className="field"
            value={form.publicBaseUrl}
            onChange={(event) => updateForm({ publicBaseUrl: event.target.value })}
            placeholder="https://dev.zroimg.com"
          />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="label">API Key</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            value={form.apiKey}
            onChange={(event) => updateForm({ apiKey: event.target.value })}
            placeholder={settings.hasApiKey ? "留空表示保留当前密钥" : "请输入视频 Provider 密钥"}
            disabled={form.shouldClearKey}
          />
          <span className="text-xs text-muted">
            {settings.hasApiKey
              ? `已配置（${settings.apiKeyPreview}，来源：${sourceLabels[settings.apiKeySource]}）`
              : "未配置"}
          </span>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={form.shouldClearKey}
          onChange={(event) => updateForm({ shouldClearKey: event.target.checked })}
        />
        清空数据库里的视频密钥
      </label>
      <Toggle
        checked={form.isEnabled}
        onChange={(nextValue) => updateForm({ isEnabled: nextValue })}
        label="启用视频生成"
        description="启用后，用户可以创建视频任务并消耗积分。"
      />

      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <button className="btn-primary w-full md:w-fit" disabled={isSaving || !form.model.trim()}>
        {isSaving ? "保存中" : "保存视频设置"}
      </button>
    </form>
  );
}

export function EasyPaySettingsForm(props: EasyPaySettingsFormProps) {
  const initialSettings = props.initialSettings;

  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState({
    isEnabled: initialSettings.enabled,
    apiBase: initialSettings.apiBase ?? "",
    pid: initialSettings.pid ?? "",
    key: "",
    notifyUrl: initialSettings.notifyUrl,
    returnUrl: initialSettings.returnUrl,
  });
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  function updateForm(nextForm: Partial<typeof form>) {
    setForm((currentForm) => {
      const newForm = {
        ...currentForm,
        ...nextForm,
      };

      return newForm;
    });
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = await adminSettingsApi.saveEasyPaySettings({
        enabled: form.isEnabled,
        apiBase: form.apiBase,
        pid: form.pid,
        key: form.key,
        clearKey: false,
        notifyUrl: form.notifyUrl,
        returnUrl: form.returnUrl,
      });
      setSaving(false);
      setSettings(data.settings);
      updateForm({
        key: "",
      });
      setMessage("易支付配置已保存，新订单会使用这套配置。");
    } catch (error) {
      setSaving(false);
      setMessage(getErrorMessage(error));
      return;
    }
  }

  return (
    <form className={styles.adminForms__form} onSubmit={saveSettings}>
      <div className={styles.adminForms__header}>
        <div>
          <h2 className={styles.adminForms__title}>易支付设置</h2>
        </div>
        <span className="rounded-md bg-soft px-3 py-2 text-xs font-medium text-muted">
          {form.isEnabled ? "已启用" : "已停用"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">API 地址</span>
          <input
            className="field"
            value={form.apiBase}
            onChange={(event) => updateForm({ apiBase: event.target.value })}
            placeholder="https://pay.example.com"
          />
        </label>
        <label className="grid gap-2">
          <span className="label">商户 PID</span>
          <input
            className="field"
            value={form.pid}
            onChange={(event) => updateForm({ pid: event.target.value })}
            placeholder="1000"
          />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="label">商户密钥</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            value={form.key}
            onChange={(event) => updateForm({ key: event.target.value })}
            placeholder={settings.hasKey ? "留空表示保留当前密钥" : "请输入易支付商户密钥"}
          />
        </label>
        <label className="grid gap-2">
          <span className="label">异步回调地址</span>
          <input
            className="field"
            value={form.notifyUrl}
            onChange={(event) => updateForm({ notifyUrl: event.target.value })}
          />
        </label>
        <label className="grid gap-2">
          <span className="label">支付返回地址</span>
          <input
            className="field"
            value={form.returnUrl}
            onChange={(event) => updateForm({ returnUrl: event.target.value })}
          />
        </label>
      </div>

      <Toggle
        checked={form.isEnabled}
        onChange={(nextValue) => updateForm({ isEnabled: nextValue })}
        label="启用易支付"
        description="关闭后用户将无法创建新的积分购买订单。"
      />

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button className="btn-primary w-full md:w-fit" disabled={isSaving}>
        {isSaving ? "保存中" : "保存易支付设置"}
      </button>
    </form>
  );
}

export function CheckInSettingsForm(props: CheckInSettingsFormProps) {
  const initialSettings = props.initialSettings;

  const [dailyCredits, setDailyCredits] = useState(String(initialSettings.dailyCredits));
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = await adminSettingsApi.saveCheckInSettings({
        dailyCredits: Number(dailyCredits),
      });
      setSaving(false);
      setDailyCredits(String(data.settings.dailyCredits));
      setMessage("签到积分已保存。");
    } catch (error) {
      setSaving(false);
      setMessage(getErrorMessage(error));
      return;
    }
  }

  return (
    <form className={styles.adminForms__form} onSubmit={saveSettings}>
      <div className={styles.adminForms__header}>
        <div>
          <h2 className={styles.adminForms__title}>每日签到设置</h2>
        </div>
        <span className="rounded-md bg-soft px-3 py-2 text-xs font-medium text-muted">
          当前每日 +{dailyCredits || 0} 积分
        </span>
      </div>

      <label className="grid gap-2 md:max-w-xs">
        <span className="label">每日赠送积分</span>
        <input
          className="field"
          inputMode="numeric"
          min={1}
          max={10000}
          value={dailyCredits}
          onChange={(event) => setDailyCredits(event.target.value)}
        />
      </label>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button className="btn-primary w-full md:w-fit" disabled={isSaving || !dailyCredits.trim()}>
        {isSaving ? "保存中" : "保存签到设置"}
      </button>
    </form>
  );
}
