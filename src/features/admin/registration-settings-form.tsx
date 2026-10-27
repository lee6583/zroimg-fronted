"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type { RegistrationSettingsConfig } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import { parseRewardPointsInput, registerRewardPointsRange } from "@/utils/registration";
import { Affix, Field, FormCard, SwitchRow } from "./admin-form";
import workspace from "./admin-workspace.module.css";

type RegistrationSettingsFormProps = {
  initialSettings: RegistrationSettingsConfig;
};

function readForm(settings: RegistrationSettingsConfig) {
  return {
    isEnabled: settings.registrationEnabled,
    rewardPoints: String(settings.registerRewardPoints),
  };
}

export function RegistrationSettingsForm(props: RegistrationSettingsFormProps) {
  const initialSettings = props.initialSettings;

  const router = useRouter();
  const [form, setForm] = useState(() => readForm(initialSettings));
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  const rewardPoints = parseRewardPointsInput(form.rewardPoints);

  async function saveSettings() {
    if (rewardPoints === null) {
      setMessage(
        `新用户初始积分必须是 ${registerRewardPointsRange.min} 到 ${registerRewardPointsRange.max} 之间的整数`,
      );
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const nextSettings = await adminSettingsApi.saveRegistration({
        registrationEnabled: form.isEnabled,
        registerRewardPoints: rewardPoints,
      });
      setForm(readForm(nextSettings));
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
      title="用户"
      message={message}
      saveLabel="保存"
      isSaving={isSaving}
      canSave={Boolean(form.rewardPoints.trim())}
      onSubmit={saveSettings}
    >
      <div className={workspace.switchList}>
        <SwitchRow
          label="开放注册"
          hint="关闭后新用户无法注册，已有用户登录和找回密码不受影响"
          checked={form.isEnabled}
          onChange={(nextEnabled) => setForm((current) => ({ ...current, isEnabled: nextEnabled }))}
        />
      </div>

      <div className={workspace.formGrid}>
        <Field
          label="新用户初始积分"
          hint={`${registerRewardPointsRange.min} – ${registerRewardPointsRange.max}，0 表示不赠送，注册页会隐藏赠送提示`}
        >
          <Affix suffix="积分">
            <input
              type="number"
              inputMode="numeric"
              min={registerRewardPointsRange.min}
              max={registerRewardPointsRange.max}
              step={1}
              required
              value={form.rewardPoints}
              onChange={(event) =>
                setForm((current) => ({ ...current, rewardPoints: event.target.value }))
              }
            />
          </Affix>
        </Field>
      </div>
    </FormCard>
  );
}
