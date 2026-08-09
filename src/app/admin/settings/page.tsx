import { AdminShell } from "@/components/layout/admin-shell";
import { AnnouncementSettingsForm } from "@/features/admin/announcement-settings-form";
import { GenerationSettingsForm } from "@/features/admin/generation-settings-form";
import {
  CheckInSettingsForm,
  EasyPaySettingsForm,
  SmtpSettingsForm,
  VideoSettingsForm,
} from "@/features/admin/service-settings-forms";
import { requireAdmin } from "@/server/auth";
import {
  getAnnouncementSettings,
  getCheckInSettings,
  getEasyPayAdminConfig,
  getGenerationConfig,
  getSmtpAdminConfig,
  getVideoConfig,
} from "@/server/bff/account";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [
    generationSettings,
    videoSettings,
    smtpSettings,
    easyPaySettings,
    checkInSettings,
    announcementSettings,
  ] = await Promise.all([
    getGenerationConfig(),
    getVideoConfig(),
    getSmtpAdminConfig(),
    getEasyPayAdminConfig(),
    getCheckInSettings(),
    getAnnouncementSettings(),
  ]);

  return (
    <AdminShell active="settings">
      <div className="grid gap-6">
        <section>
          <h1 className="page-title">系统设置</h1>
        </section>

        <GenerationSettingsForm initialSettings={generationSettings} />
        <VideoSettingsForm initialSettings={videoSettings} />
        <SmtpSettingsForm initialSettings={smtpSettings} />
        <EasyPaySettingsForm initialSettings={easyPaySettings} />
        <CheckInSettingsForm initialSettings={checkInSettings} />
        <AnnouncementSettingsForm initialSettings={announcementSettings} />
      </div>
    </AdminShell>
  );
}
