import clsx from "clsx";
import { CreditCard, Gift, Mail, Megaphone } from "lucide-react";
import Link from "next/link";
import workspace from "@/features/admin/admin-workspace.module.css";
import { AnnouncementSettingsForm } from "@/features/admin/announcement-settings-form";
import {
  CheckInSettingsForm,
  EasyPaySettingsForm,
  SmtpSettingsForm,
} from "@/features/admin/service-settings-forms";
import { requestJava } from "@/server/java-api";
import type {
  AnnouncementSettingsConfig,
  CheckInSettingsConfig,
  EasyPayAdminConfig,
  SmtpAdminConfig,
} from "@/types/admin";
import styles from "./settings.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminSettingsPageProps = {
  searchParams: SearchParams;
};

const sectionIds = ["payment", "smtp", "checkin", "announcement"] as const;
type SettingsSection = (typeof sectionIds)[number];

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminSettingsPage(props: AdminSettingsPageProps) {
  const params = await props.searchParams;
  const requestedSection = readParam(params, "section");
  const section = sectionIds.includes(requestedSection as SettingsSection)
    ? (requestedSection as SettingsSection)
    : "payment";
  const [smtpSettings, easyPaySettings, checkInSettings, announcementSettings] = await Promise.all([
    requestJava<SmtpAdminConfig>("/admin/settings/smtp"),
    requestJava<EasyPayAdminConfig>("/admin/settings/easypay"),
    requestJava<CheckInSettingsConfig>("/admin/settings/checkin"),
    requestJava<AnnouncementSettingsConfig>("/admin/settings/announcement"),
  ]);

  const sections = [
    {
      id: "payment" as const,
      label: "支付服务",
      description: easyPaySettings.enabled ? "当前已启用" : "当前已停用",
      icon: CreditCard,
    },
    {
      id: "smtp" as const,
      label: "邮件服务",
      description: smtpSettings.enabled ? "当前已启用" : "当前已停用",
      icon: Mail,
    },
    {
      id: "checkin" as const,
      label: "签到奖励",
      description: `每日 +${checkInSettings.dailyCredits} 积分`,
      icon: Gift,
    },
    {
      id: "announcement" as const,
      label: "站内公告",
      description: announcementSettings.enabled ? "当前已启用" : "当前已停用",
      icon: Megaphone,
    },
  ];

  return (
    <div className={workspace.workspace}>
      <header className={workspace.header}>
        <div className={workspace.headerCopy}>
          <h1 className="page-title">系统设置</h1>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.nav}>
          <header className={styles.navHeader}>
            <h2 className={styles.navTitle}>设置分类</h2>
          </header>
          <nav className={styles.navList} aria-label="系统设置分类">
            {sections.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={`/admin/settings?section=${item.id}`}
                  className={clsx(styles.navLink, section === item.id && styles.navLinkActive)}
                  aria-current={section === item.id ? "page" : undefined}
                >
                  <span className={styles.navIcon}>
                    <Icon size={15} aria-hidden="true" />
                  </span>
                  <span className={styles.navCopy}>
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <section className={styles.content}>
          {section === "payment" ? <EasyPaySettingsForm initialSettings={easyPaySettings} /> : null}
          {section === "smtp" ? <SmtpSettingsForm initialSettings={smtpSettings} /> : null}
          {section === "checkin" ? <CheckInSettingsForm initialSettings={checkInSettings} /> : null}
          {section === "announcement" ? (
            <AnnouncementSettingsForm initialSettings={announcementSettings} />
          ) : null}
        </section>
      </div>
    </div>
  );
}
