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
          <h1 className={styles.settings__title}>账户设置</h1>
          <p className={styles.settings__description}>管理个人资料、登录密码，以及仅保存在当前浏览器里的自定义生图配置。</p>
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
