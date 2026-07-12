import { AppShell } from "@/components/layout/app-shell";
import { AccountSettingsForm } from "@/features/settings/account-settings-form";
import { requireUser } from "@/server/auth";
import styles from "./settings.module.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const current = await requireUser();

  return (
    <AppShell active="settings">
      <div className={styles.settings}>
        <section className={styles.settings__header}>
          <h1 className="page-title">账户设置</h1>
          <p className="page-description">管理个人资料与登录密码。</p>
        </section>

        <AccountSettingsForm
          username={current.profile.username}
          email={current.user.email}
          bio={current.profile.bio || ""}
        />
      </div>
    </AppShell>
  );
}
