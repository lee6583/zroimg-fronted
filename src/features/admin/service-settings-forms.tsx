"use client";

import { useState, type FormEvent } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type {
  CheckInSettingsConfig,
  EasyPayAdminConfig,
  SecretSource,
  SmtpAdminConfig,
} from "@/types/admin";
import styles from "./admin-forms.module.css";

const sourceLabels: Record<SecretSource, string> = {
  database: "后台数据库",
  env: ".env 兜底",
  none: "未配置",
};

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={styles.adminForms__toggle}
    >
      <span>
        <span className={styles.adminForms__toggleLabel}>{label}</span>
        <span className={styles.adminForms__toggleDescription}>
          {description}
        </span>
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

export function SmtpSettingsForm({
  initialSettings,
}: {
  initialSettings: SmtpAdminConfig;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [enabled, setEnabled] = useState(initialSettings.enabled);
  const [host, setHost] = useState(initialSettings.host ?? "");
  const [port, setPort] = useState(String(initialSettings.port));
  const [secure, setSecure] = useState(initialSettings.secure);
  const [user, setUser] = useState(initialSettings.user ?? "");
  const [password, setPassword] = useState("");
  const [clearPassword, setClearPassword] = useState(false);
  const [from, setFrom] = useState(initialSettings.from);
  const [testEmail, setTestEmail] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = await adminSettingsApi.saveSmtpSettings({
        enabled,
        host,
        port: Number(port),
        secure,
        user,
        password,
        clearPassword,
        from,
      });
      setSaving(false);
      setSettings(data.settings);
      setPassword("");
      setClearPassword(false);
      setMessage("SMTP 配置已保存。");
    } catch (error) {
      setSaving(false);
      setMessage(error instanceof Error ? error.message : "保存失败");
      return;
    }
  }

  async function testSmtp(mode: "connection" | "email") {
    setTesting(true);
    setMessage("");
    try {
      await adminSettingsApi.testSmtpSettings(
        mode === "connection" ? { mode } : { mode, email: testEmail },
      );
      setTesting(false);
      setMessage(
        mode === "connection" ? "SMTP 连接测试通过。" : "测试邮件已发送。",
      );
    } catch (error) {
      setTesting(false);
      setMessage(error instanceof Error ? error.message : "测试失败");
      return;
    }
  }

  return (
    <form className="surface grid gap-5 rounded-xl p-5" onSubmit={saveSettings}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="label">SMTP</p>
          <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight">
            SMTP 邮件设置
          </h2>
          <p className="mt-2 text-sm text-muted">
            用于发送注册验证码和系统邮件，生产环境建议配置真实邮箱服务。
          </p>
        </div>
        <button
          className="btn-secondary"
          type="button"
          disabled={testing}
          onClick={() => testSmtp("connection")}
        >
          {testing ? "测试中" : "测试连接"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">SMTP 主机</span>
          <input
            className="field"
            value={host}
            onChange={(event) => setHost(event.target.value)}
            placeholder="smtp.qq.com"
          />
        </label>
        <label className="grid gap-2">
          <span className="label">SMTP 端口</span>
          <input
            className="field"
            inputMode="numeric"
            value={port}
            onChange={(event) => setPort(event.target.value)}
            placeholder="465"
          />
        </label>
        <label className="grid gap-2">
          <span className="label">SMTP 用户名</span>
          <input
            className="field"
            value={user}
            onChange={(event) => setUser(event.target.value)}
            placeholder="name@example.com"
          />
        </label>
        <label className="grid gap-2">
          <span className="label">SMTP 密码</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              settings.hasPassword
                ? "留空表示保留当前密码"
                : "请输入 SMTP 授权码或密码"
            }
            disabled={clearPassword}
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
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            placeholder="ZroCode <noreply@example.com>"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={clearPassword}
          onChange={(event) => setClearPassword(event.target.checked)}
        />
        清空数据库里保存的 SMTP 密码
      </label>

      <Toggle
        checked={secure}
        onChange={setSecure}
        label="使用 TLS"
        description="465 端口通常开启 TLS，587 端口通常使用 STARTTLS。"
      />
      <Toggle
        checked={enabled}
        onChange={setEnabled}
        label="启用 SMTP"
        description="关闭后生产环境将无法发送注册验证码。"
      />

      <div className="grid gap-3 border-t border-line pt-5 md:grid-cols-[1fr_auto]">
        <input
          className="field"
          type="email"
          value={testEmail}
          onChange={(event) => setTestEmail(event.target.value)}
          placeholder="test@example.com"
        />
        <button
          className="btn-secondary"
          type="button"
          disabled={testing || !testEmail.trim()}
          onClick={() => testSmtp("email")}
        >
          发送测试邮件
        </button>
      </div>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button className="btn-primary w-full md:w-fit" disabled={saving}>
        {saving ? "保存中" : "保存 SMTP 设置"}
      </button>
    </form>
  );
}

export function EasyPaySettingsForm({
  initialSettings,
}: {
  initialSettings: EasyPayAdminConfig;
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [enabled, setEnabled] = useState(initialSettings.enabled);
  const [apiBase, setApiBase] = useState(initialSettings.apiBase ?? "");
  const [pid, setPid] = useState(initialSettings.pid ?? "");
  const [key, setKey] = useState("");
  const [clearKey, setClearKey] = useState(false);
  const [notifyUrl, setNotifyUrl] = useState(initialSettings.notifyUrl);
  const [returnUrl, setReturnUrl] = useState(initialSettings.returnUrl);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = await adminSettingsApi.saveEasyPaySettings({
        enabled,
        apiBase,
        pid,
        key,
        clearKey,
        notifyUrl,
        returnUrl,
      });
      setSaving(false);
      setSettings(data.settings);
      setKey("");
      setClearKey(false);
      setMessage("易支付配置已保存，新订单会使用这套配置。");
    } catch (error) {
      setSaving(false);
      setMessage(error instanceof Error ? error.message : "保存失败");
      return;
    }
  }

  return (
    <form className="surface grid gap-5 rounded-xl p-5" onSubmit={saveSettings}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="label">Payment</p>
          <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight">
            易支付设置
          </h2>
          <p className="mt-2 text-sm text-muted">
            配置第三方易支付服务商，用于积分购买订单创建和异步回调验签。
          </p>
        </div>
        <span className="rounded-md bg-soft px-3 py-2 text-xs font-medium text-muted">
          {enabled ? "已启用" : "已停用"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2">
          <span className="label">API 地址</span>
          <input
            className="field"
            value={apiBase}
            onChange={(event) => setApiBase(event.target.value)}
            placeholder="https://pay.example.com"
          />
          <span className="text-xs text-muted">
            填写易支付服务根地址，不需要带 `submit.php`。
          </span>
        </label>
        <label className="grid gap-2">
          <span className="label">商户 PID</span>
          <input
            className="field"
            value={pid}
            onChange={(event) => setPid(event.target.value)}
            placeholder="1000"
          />
        </label>
        <label className="grid gap-2 md:col-span-2">
          <span className="label">商户密钥</span>
          <input
            className="field"
            type="password"
            autoComplete="new-password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder={
              settings.hasKey ? "留空表示保留当前密钥" : "请输入易支付商户密钥"
            }
            disabled={clearKey}
          />
          <span className="text-xs text-muted">
            当前状态：
            {settings.hasKey
              ? `已配置（${settings.keyPreview}，来源：${sourceLabels[settings.keySource]}）`
              : "未配置"}
          </span>
        </label>
        <label className="grid gap-2">
          <span className="label">异步回调地址</span>
          <input
            className="field"
            value={notifyUrl}
            onChange={(event) => setNotifyUrl(event.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="label">支付返回地址</span>
          <input
            className="field"
            value={returnUrl}
            onChange={(event) => setReturnUrl(event.target.value)}
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={clearKey}
          onChange={(event) => setClearKey(event.target.checked)}
        />
        清空数据库里保存的易支付密钥
      </label>

      <Toggle
        checked={enabled}
        onChange={setEnabled}
        label="启用易支付"
        description="关闭后用户将无法创建新的积分购买订单。"
      />

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button className="btn-primary w-full md:w-fit" disabled={saving}>
        {saving ? "保存中" : "保存易支付设置"}
      </button>
    </form>
  );
}

export function CheckInSettingsForm({
  initialSettings,
}: {
  initialSettings: CheckInSettingsConfig;
}) {
  const [dailyCredits, setDailyCredits] = useState(
    String(initialSettings.dailyCredits),
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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
      setMessage(error instanceof Error ? error.message : "保存失败");
      return;
    }
  }

  return (
    <form className="surface grid gap-5 rounded-xl p-5" onSubmit={saveSettings}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="label">Check-in</p>
          <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight">
            每日签到设置
          </h2>
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

      <button
        className="btn-primary w-full md:w-fit"
        disabled={saving || !dailyCredits.trim()}
      >
        {saving ? "保存中" : "保存签到设置"}
      </button>
    </form>
  );
}
