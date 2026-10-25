"use client";

import clsx from "clsx";
import { getErrorMessage } from "@/utils/error";
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

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
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

function Toggle(props: ToggleProps) {
  const checked = props.checked;
  const onChange = props.onChange;
  const label = props.label;
  const description = props.description;

  return (
    <button type="button" onClick={() => onChange(!checked)} className={styles.adminForms__toggle}>
      <span>
        <span className={styles.adminForms__toggleLabel}>{label}</span>
        {description ? (
          <span className={styles.adminForms__toggleDescription}>{description}</span>
        ) : null}
      </span>
      <span
        className={clsx(styles.adminForms__switch, checked && styles.adminForms__switchChecked)}
      >
        <span
          className={clsx(
            styles.adminForms__switchThumb,
            checked && styles.adminForms__switchThumbChecked,
          )}
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
      const nextSettings = await adminSettingsApi.saveSmtp({
        enabled: form.isEnabled,
        host: form.host,
        port: Number(form.port),
        secure: form.isSecure,
        user: form.user,
        password: form.password,
        clearPassword: form.shouldClearPassword,
        from: form.from,
      });
      setSettings(nextSettings);
      updateForm({
        password: "",
        shouldClearPassword: false,
      });
      setMessage("SMTP 配置已保存。");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function testSmtp(mode: "connection" | "email") {
    setTesting(true);
    setMessage("");
    try {
      const isConnection = mode === "connection";
      const data = isConnection ? { mode } : { mode, email: form.testEmail };
      await adminSettingsApi.testSmtp(data);

      if (isConnection) {
        setMessage("SMTP 连接测试通过。");
      } else {
        setMessage("测试邮件已发送。");
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setTesting(false);
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
    feeRatePercent: String(initialSettings.feeRatePercent),
    timeoutMinutes: String(initialSettings.timeoutMinutes),
    creditsPerYuan: String(initialSettings.creditsPerYuan),
    maxPendingOrders: String(initialSettings.maxPendingOrders),
    minAmount: String(initialSettings.minAmountCent / 100),
    maxAmount: String(initialSettings.maxAmountCent / 100),
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
      const nextSettings = await adminSettingsApi.saveEasyPay({
        enabled: form.isEnabled,
        apiBase: form.apiBase,
        pid: form.pid,
        key: form.key,
        clearKey: false,
        notifyUrl: form.notifyUrl,
        returnUrl: form.returnUrl,
        feeRatePercent: Number(form.feeRatePercent),
        timeoutMinutes: Number(form.timeoutMinutes),
        creditsPerYuan: Number(form.creditsPerYuan),
        maxPendingOrders: Number(form.maxPendingOrders),
        minAmountCent: Math.round(Number(form.minAmount) * 100),
        maxAmountCent: Math.round(Number(form.maxAmount) * 100),
      });
      setSettings(nextSettings);
      updateForm({
        key: "",
      });
      setMessage("支付配置已保存。");
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
          <h2 className={styles.adminForms__title}>易支付设置</h2>
        </div>
        <span className="rounded-md bg-soft px-3 py-2 text-xs font-medium text-muted">
          {form.isEnabled ? "已启用" : "已停用"}
        </span>
      </div>

      <section className={styles.adminForms__section}>
        <h3 className={styles.adminForms__sectionTitle}>支付网关</h3>
        <div className={styles.adminForms__fieldGrid}>
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
      </section>

      <section className={styles.adminForms__section}>
        <h3 className={styles.adminForms__sectionTitle}>充值规则</h3>
        <div className={styles.adminForms__fieldGrid}>
          <label className="grid gap-2">
            <span className="label">充值比例</span>
            <span className={styles.adminForms__inputWithUnit}>
              <span className={styles.adminForms__unitPrefix}>1 元 =</span>
              <input
                className="field"
                type="number"
                inputMode="numeric"
                min={1}
                max={10000}
                required
                value={form.creditsPerYuan}
                onChange={(event) => updateForm({ creditsPerYuan: event.target.value })}
              />
              <span className={styles.adminForms__unit}>积分</span>
            </span>
          </label>
          <label className="grid gap-2">
            <span className="label">订单充值手续费</span>
            <span className={styles.adminForms__inputWithUnit}>
              <input
                className="field"
                type="number"
                inputMode="decimal"
                min={0}
                max={30}
                step="0.01"
                required
                value={form.feeRatePercent}
                onChange={(event) => updateForm({ feeRatePercent: event.target.value })}
              />
              <span className={styles.adminForms__unit}>%</span>
            </span>
          </label>
          <label className="grid gap-2">
            <span className="label">最低充值金额</span>
            <span className={styles.adminForms__inputWithUnit}>
              <input
                className="field"
                type="number"
                inputMode="decimal"
                min={0.01}
                max={1000000}
                step="0.01"
                required
                value={form.minAmount}
                onChange={(event) => updateForm({ minAmount: event.target.value })}
              />
              <span className={styles.adminForms__unit}>元</span>
            </span>
          </label>
          <label className="grid gap-2">
            <span className="label">最高充值金额</span>
            <span className={styles.adminForms__inputWithUnit}>
              <input
                className="field"
                type="number"
                inputMode="decimal"
                min={0.01}
                max={1000000}
                step="0.01"
                required
                value={form.maxAmount}
                onChange={(event) => updateForm({ maxAmount: event.target.value })}
              />
              <span className={styles.adminForms__unit}>元</span>
            </span>
          </label>
        </div>
      </section>

      <section className={styles.adminForms__section}>
        <h3 className={styles.adminForms__sectionTitle}>订单规则</h3>
        <div className={styles.adminForms__fieldGrid}>
          <label className="grid gap-2">
            <span className="label">订单超时时间</span>
            <span className={styles.adminForms__inputWithUnit}>
              <input
                className="field"
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                required
                value={form.timeoutMinutes}
                onChange={(event) => updateForm({ timeoutMinutes: event.target.value })}
              />
              <span className={styles.adminForms__unit}>分钟</span>
            </span>
          </label>
          <label className="grid gap-2">
            <span className="label">最大待支付订单数</span>
            <span className={styles.adminForms__inputWithUnit}>
              <input
                className="field"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                required
                value={form.maxPendingOrders}
                onChange={(event) => updateForm({ maxPendingOrders: event.target.value })}
              />
              <span className={styles.adminForms__unit}>笔 / 用户</span>
            </span>
          </label>
        </div>
      </section>

      <div className={styles.adminForms__section}>
        <Toggle
          checked={form.isEnabled}
          onChange={(nextValue) => updateForm({ isEnabled: nextValue })}
          label="启用易支付"
        />
      </div>

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
      const nextSettings = await adminSettingsApi.saveCheckIn({
        dailyCredits: Number(dailyCredits),
      });
      setDailyCredits(String(nextSettings.dailyCredits));
      setMessage("签到积分已保存。");
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
