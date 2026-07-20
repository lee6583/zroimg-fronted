import { AccountSettingsForm } from "@/features/settings/account-settings-form";
import { requireUser } from "@/server/auth";
import styles from "./settings.module.css";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const current = await requireUser();

  return (
    <div className={styles.settings}>
      <section className={styles.settings__header}>
        <h1 className="page-title">账户设置</h1>
      </section>

      <AccountSettingsForm
        username={current.profile.username}
        email={current.user.email}
        bio={current.profile.bio || ""}
      />
    </div>
  );
}
