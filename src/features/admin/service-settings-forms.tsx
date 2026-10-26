"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type {
  CheckInSettingsConfig,
  EasyPayAdminConfig,
  SecretSource,
  SmtpAdminConfig,
} from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import { Advanced, Affix, Field, FormCard, SwitchRow } from "./admin-form";
import workspace from "./admin-workspace.module.css";

type SmtpSettingsFormProps = {
  initialSettings: SmtpAdminConfig;
};

type EasyPaySettingsFormProps = {
  initialSettings: EasyPayAdminConfig;
};

type CheckInSettingsFormProps = {
  initialSettings: CheckInSettingsConfig;
};

const sourceLabels: Record<SecretSource, string> = {
  database: "后台数据库",
  env: ".env 兜底",
  none: "未配置",
};

const defaultFromName = "zroimg";

function secretHint(hasSecret: boolean, preview: string | null, source: SecretSource) {
  if (!hasSecret) {
    return "当前未配置";
  }
  return `当前 ${preview ?? "已配置"}，来源：${sourceLabels[source]}`;
}

function readSender(settings: SmtpAdminConfig) {
  // 接口返回生效值；与默认值相同时留空，让默认值继续跟随 SMTP 账号变化。
  const user = settings.user ?? "";
  const fromName = settings.fromName === defaultFromName ? "" : settings.fromName;
  const fromEmail = settings.fromEmail === user ? "" : settings.fromEmail;

  return { fromName, fromEmail };
}

export function SmtpSettingsForm(props: SmtpSettingsFormProps) {
  const initialSettings = props.initialSettings;

  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState(() => {
    const sender = readSender(initialSettings);
    return {
      isEnabled: initialSettings.enabled,
      host: initialSettings.host ?? "",
      port: String(initialSettings.port),
      isSecure: initialSettings.secure,
      user: initialSettings.user ?? "",
      password: "",
      shouldClearPassword: false,
      fromName: sender.fromName,
      fromEmail: sender.fromEmail,
      testEmail: "",
    };
  });
  const [isSecureTouched, setSecureTouched] = useState(false);
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

  function updatePort(port: string) {
    if (isSecureTouched) {
      updateForm({ port });
      return;
    }
    updateForm({ port, isSecure: port.trim() === "465" });
  }

  function updateSecure(isSecure: boolean) {
    setSecureTouched(true);
    updateForm({ isSecure });
  }

  function clearPassword() {
    if (form.shouldClearPassword) {
      updateForm({ shouldClearPassword: false });
      return;
    }
    if (!window.confirm("确定清除后台保存的 SMTP 授权码吗？保存后生效。")) {
      return;
    }
    updateForm({ password: "", shouldClearPassword: true });
  }

  async function saveSettings() {
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
        fromName: form.fromName.trim(),
        fromEmail: form.fromEmail.trim(),
      });
      setSettings(nextSettings);
      updateForm({
        password: "",
        shouldClearPassword: false,
      });
      setMessage("已保存");
      router.refresh();
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
        setMessage("SMTP 连接测试通过");
      } else {
        setMessage("测试邮件已发送");
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setTesting(false);
    }
  }

  let passwordPlaceholder = "请输入授权码";
  if (form.shouldClearPassword) {
    passwordPlaceholder = "保存后清除当前授权码";
  } else if (settings.hasPassword) {
    passwordPlaceholder = "留空保留当前授权码";
  }
  const canClearPassword = settings.hasPassword && settings.passwordSource === "database";

  return (
    <FormCard
      title="邮件服务"
      actions={
        <button
          className={workspace.secondaryAction}
          type="button"
          disabled={isTesting}
          onClick={() => testSmtp("connection")}
        >
          {isTesting ? "测试中" : "测试连接"}
        </button>
      }
      message={message}
      saveLabel="保存"
      isSaving={isSaving}
      onSubmit={saveSettings}
    >
      <div className={workspace.switchList}>
        <SwitchRow
          label="启用邮件服务"
          hint={form.isEnabled ? undefined : "关闭后无法发送注册验证码"}
          checked={form.isEnabled}
          onChange={(isEnabled) => updateForm({ isEnabled })}
        />
      </div>

      <div className={workspace.formGrid}>
        <Field label="SMTP 主机">
          <input
            className={workspace.formField}
            value={form.host}
            onChange={(event) => updateForm({ host: event.target.value })}
            placeholder="smtp.qq.com"
          />
        </Field>
        <Field label="端口">
          <input
            className={workspace.formField}
            inputMode="numeric"
            value={form.port}
            onChange={(event) => updatePort(event.target.value)}
            placeholder="465"
          />
        </Field>
        <Field label="账号">
          <input
            className={workspace.formField}
            autoComplete="off"
            value={form.user}
            onChange={(event) => updateForm({ user: event.target.value })}
            placeholder="name@example.com"
          />
        </Field>
        <Field
          label="授权码"
          hint={secretHint(settings.hasPassword, settings.passwordPreview, settings.passwordSource)}
        >
          <span className={workspace.inlineRow}>
            <input
              className={workspace.formField}
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(event) => updateForm({ password: event.target.value })}
              placeholder={passwordPlaceholder}
              disabled={form.shouldClearPassword}
            />
            {canClearPassword ? (
              <button className={workspace.secondaryAction} type="button" onClick={clearPassword}>
                {form.shouldClearPassword ? "撤销" : "清除"}
              </button>
            ) : null}
          </span>
        </Field>
        <Field label="发件人名称">
          <input
            className={workspace.formField}
            value={form.fromName}
            onChange={(event) => updateForm({ fromName: event.target.value })}
            placeholder={defaultFromName}
          />
        </Field>
        <Field label="发件邮箱">
          <input
            className={workspace.formField}
            type="email"
            value={form.fromEmail}
            onChange={(event) => updateForm({ fromEmail: event.target.value })}
            placeholder={form.user || "默认使用 SMTP 账号"}
          />
        </Field>
        <Field label="发送测试邮件" isFull>
          <span className={workspace.inlineRow}>
            <input
              className={workspace.formField}
              type="email"
              value={form.testEmail}
              onChange={(event) => updateForm({ testEmail: event.target.value })}
              placeholder="test@example.com"
            />
            <button
              className={workspace.secondaryAction}
              type="button"
              disabled={isTesting || !form.testEmail.trim()}
              onClick={() => testSmtp("email")}
            >
              发送
            </button>
          </span>
        </Field>
      </div>

      <Advanced id="smtp">
        <div className={workspace.switchList}>
          <SwitchRow
            label="使用 TLS"
            hint="465 端口通常开启，587 端口使用 STARTTLS"
            checked={form.isSecure}
            onChange={updateSecure}
          />
        </div>
      </Advanced>
    </FormCard>
  );
}

export function EasyPaySettingsForm(props: EasyPaySettingsFormProps) {
  const initialSettings = props.initialSettings;

  const router = useRouter();
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

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    try {
      const nextSettings = await adminSettingsApi.saveEasyPay({
        enabled: form.isEnabled,
        apiBase: form.apiBase,
        pid: form.pid,
        key: form.key,
        clearKey: false,
        notifyUrl: form.notifyUrl.trim(),
        returnUrl: form.returnUrl.trim(),
        feeRatePercent: Number(form.feeRatePercent),
        timeoutMinutes: Number(form.timeoutMinutes),
        creditsPerYuan: Number(form.creditsPerYuan),
        maxPendingOrders: Number(form.maxPendingOrders),
        minAmountCent: Math.round(Number(form.minAmount) * 100),
        maxAmountCent: Math.round(Number(form.maxAmount) * 100),
      });
      setSettings(nextSettings);
      updateForm({ key: "" });
      setMessage("已保存");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const notifyDefault = settings.effectiveNotifyUrl;
  const returnDefault = settings.effectiveReturnUrl;

  return (
    <FormCard
      title="支付服务"
      message={message}
      saveLabel="保存"
      isSaving={isSaving}
      onSubmit={saveSettings}
    >
      <div className={workspace.switchList}>
        <SwitchRow
          label="启用易支付"
          checked={form.isEnabled}
          onChange={(isEnabled) => updateForm({ isEnabled })}
        />
      </div>

      <div className={workspace.formGrid}>
        <Field label="API 地址">
          <input
            className={workspace.formField}
            value={form.apiBase}
            onChange={(event) => updateForm({ apiBase: event.target.value })}
            placeholder="https://pay.example.com"
          />
        </Field>
        <Field label="商户 PID">
          <input
            className={workspace.formField}
            value={form.pid}
            onChange={(event) => updateForm({ pid: event.target.value })}
            placeholder="1000"
          />
        </Field>
        <Field
          label="商户密钥"
          hint={secretHint(settings.hasKey, settings.keyPreview, settings.keySource)}
        >
          <input
            className={workspace.formField}
            type="password"
            autoComplete="new-password"
            value={form.key}
            onChange={(event) => updateForm({ key: event.target.value })}
            placeholder={settings.hasKey ? "留空保留当前密钥" : "请输入商户密钥"}
          />
        </Field>
        <Field label="充值比例">
          <Affix prefix="1 元 =" suffix="积分">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={10000}
              required
              value={form.creditsPerYuan}
              onChange={(event) => updateForm({ creditsPerYuan: event.target.value })}
            />
          </Affix>
        </Field>
      </div>

      <Advanced id="easypay">
        <div className={workspace.formGrid}>
          <Field
            label="异步回调地址"
            hint={notifyDefault ? `留空使用 ${notifyDefault}` : "留空使用默认地址"}
          >
            <input
              className={workspace.formField}
              value={form.notifyUrl}
              onChange={(event) => updateForm({ notifyUrl: event.target.value })}
              placeholder={notifyDefault || "默认"}
            />
          </Field>
          <Field
            label="支付返回地址"
            hint={returnDefault ? `留空使用 ${returnDefault}` : "留空使用默认地址"}
          >
            <input
              className={workspace.formField}
              value={form.returnUrl}
              onChange={(event) => updateForm({ returnUrl: event.target.value })}
              placeholder={returnDefault || "默认"}
            />
          </Field>
          <Field label="手续费" hint="0 – 30">
            <Affix suffix="%">
              <input
                type="number"
                inputMode="decimal"
                min={0}
                max={30}
                step="0.01"
                required
                value={form.feeRatePercent}
                onChange={(event) => updateForm({ feeRatePercent: event.target.value })}
              />
            </Affix>
          </Field>
          <Field label="订单超时" hint="1 – 1440">
            <Affix suffix="分钟">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={1440}
                required
                value={form.timeoutMinutes}
                onChange={(event) => updateForm({ timeoutMinutes: event.target.value })}
              />
            </Affix>
          </Field>
          <Field label="最低充值金额">
            <Affix suffix="元">
              <input
                type="number"
                inputMode="decimal"
                min={0.01}
                max={1000000}
                step="0.01"
                required
                value={form.minAmount}
                onChange={(event) => updateForm({ minAmount: event.target.value })}
              />
            </Affix>
          </Field>
          <Field label="最高充值金额">
            <Affix suffix="元">
              <input
                type="number"
                inputMode="decimal"
                min={0.01}
                max={1000000}
                step="0.01"
                required
                value={form.maxAmount}
                onChange={(event) => updateForm({ maxAmount: event.target.value })}
              />
            </Affix>
          </Field>
          <Field label="每人最多待支付订单数" hint="1 – 20">
            <Affix suffix="笔">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                required
                value={form.maxPendingOrders}
                onChange={(event) => updateForm({ maxPendingOrders: event.target.value })}
              />
            </Affix>
          </Field>
        </div>
      </Advanced>
    </FormCard>
  );
}

export function CheckInSettingsForm(props: CheckInSettingsFormProps) {
  const initialSettings = props.initialSettings;

  const router = useRouter();
  const [dailyCredits, setDailyCredits] = useState(String(initialSettings.dailyCredits));
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  async function saveSettings() {
    setSaving(true);
    setMessage("");
    try {
      const nextSettings = await adminSettingsApi.saveCheckIn({
        dailyCredits: Number(dailyCredits),
      });
      setDailyCredits(String(nextSettings.dailyCredits));
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
      title="签到奖励"
      message={message}
      saveLabel="保存"
      isSaving={isSaving}
      canSave={Boolean(dailyCredits.trim())}
      onSubmit={saveSettings}
    >
      <div className={workspace.formGrid}>
        <Field label="每日积分" hint="1 – 10000">
          <Affix suffix="积分">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={10000}
              required
              value={dailyCredits}
              onChange={(event) => setDailyCredits(event.target.value)}
            />
          </Affix>
        </Field>
      </div>
    </FormCard>
  );
}
