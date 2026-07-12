import { AdminShell } from "@/components/layout/admin-shell";
import { GenerationSettingsForm } from "@/features/admin/generation-settings-form";
import {
  CheckInSettingsForm,
  EasyPaySettingsForm,
  SmtpSettingsForm,
} from "@/features/admin/service-settings-forms";
import { requireAdmin } from "@/server/auth";
import {
  getCheckInSettings,
  getEasyPayAdminConfig,
  getGenerationConfig,
  getSmtpAdminConfig,
} from "@/server/bff/account";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [generationSettings, smtpSettings, easyPaySettings, checkInSettings] = await Promise.all([
    getGenerationConfig(),
    getSmtpAdminConfig(),
    getEasyPayAdminConfig(),
    getCheckInSettings(),
  ]);

  return (
    <AdminShell active="settings">
      <div className="grid gap-6">
        <section>
          <p className="label">Admin settings</p>
          <h1 className="page-title">系统设置</h1>
          <p className="page-description">
            配置生图服务、邮件发送、第三方支付和签到积分。密钥只在服务端保存，页面仅展示脱敏状态。
          </p>
        </section>

        <GenerationSettingsForm initialSettings={generationSettings} />
        <SmtpSettingsForm initialSettings={smtpSettings} />
        <EasyPaySettingsForm initialSettings={easyPaySettings} />
        <CheckInSettingsForm initialSettings={checkInSettings} />
      </div>
    </AdminShell>
  );
}
