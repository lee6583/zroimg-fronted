import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AccountSettingsForm } from "@/features/settings/account-settings-form";
import { requireUser } from "@/server/auth";
import styles from "./settings.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");

  return { title: t("title") };
}

export default async function SettingsPage() {
  const user = await requireUser();
  const t = await getTranslations("settings");

  return (
    <div className={styles.settings}>
      <section className={styles.settings__header}>
        <h1 className="page-title">{t("title")}</h1>
      </section>

      <AccountSettingsForm
        username={user.username}
        email={user.email}
        bio={user.bio || ""}
        avatarUrl={user.avatarUrl}
      />
    </div>
  );
}
