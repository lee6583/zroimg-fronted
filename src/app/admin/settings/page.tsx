import { AnnouncementSettingsForm } from "@/features/admin/announcement-settings-form";
import {
  CheckInSettingsForm,
  EasyPaySettingsForm,
  SmtpSettingsForm,
  VideoSettingsForm,
} from "@/features/admin/service-settings-forms";
import {
  getAnnouncementSettings,
  getCheckInSettings,
  getEasyPayAdminConfig,
  getSmtpAdminConfig,
  getVideoConfig,
} from "@/server/bff/account";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [videoSettings, smtpSettings, easyPaySettings, checkInSettings, announcementSettings] =
    await Promise.all([
      getVideoConfig(),
      getSmtpAdminConfig(),
      getEasyPayAdminConfig(),
      getCheckInSettings(),
      getAnnouncementSettings(),
    ]);

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="page-title">系统设置</h1>
      </section>

      <VideoSettingsForm initialSettings={videoSettings} />
      <SmtpSettingsForm initialSettings={smtpSettings} />
      <EasyPaySettingsForm initialSettings={easyPaySettings} />
      <CheckInSettingsForm initialSettings={checkInSettings} />
      <AnnouncementSettingsForm initialSettings={announcementSettings} />
    </div>
  );
}
