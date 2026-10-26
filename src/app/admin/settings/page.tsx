import clsx from "clsx";
import { CreditCard, Frame, Gauge, Gift, Mail, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import workspace from "@/features/admin/admin-workspace.module.css";
import { AnnouncementSettingsForm } from "@/features/admin/announcement-settings-form";
import { CanvasSettingsForm } from "@/features/admin/canvas-settings-form";
import type { CanvasModelOption } from "@/features/admin/canvas-settings-form";
import { GenerationSettingsForm } from "@/features/admin/generation-settings-form";
import {
  CheckInSettingsForm,
  EasyPaySettingsForm,
  SmtpSettingsForm,
} from "@/features/admin/service-settings-forms";
import { requireAdmin } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type {
  AdminGenerationModel,
  AnnouncementSettingsConfig,
  CanvasSettingsConfig,
  CheckInSettingsConfig,
  EasyPayAdminConfig,
  GenerationProviderConnection,
  GenerationSettingsConfig,
  SmtpAdminConfig,
} from "@/types/admin";
import styles from "./settings.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminSettingsPageProps = {
  searchParams: SearchParams;
};

const sectionIds = ["payment", "smtp", "checkin", "announcement", "canvas", "generation"] as const;
type SettingsSection = (typeof sectionIds)[number];

type SectionStatus = "configured" | "missing" | "default" | "off";

type SectionItem = {
  id: SettingsSection;
  label: string;
  status: SectionStatus;
  icon: LucideIcon;
};

type SectionGroup = {
  title: string;
  items: SectionItem[];
};

const statusLabels: Record<SectionStatus, string> = {
  configured: "已配置",
  missing: "未配置",
  default: "默认",
  off: "未启用",
};

const statusClasses: Record<SectionStatus, string | undefined> = {
  configured: styles.navStatusOk,
  missing: styles.navStatusMissing,
  default: undefined,
  off: undefined,
};

// 与 Java AdminSettingsService 的默认值保持一致，仅用于展示“默认”状态。
const canvasDefaults = {
  enabled: true,
  maxBoardsPerUser: 50,
  maxNodesPerBoard: 500,
  maxSceneKb: 2048,
  maxPendingTasksPerBoard: 4,
};

const generationDefaults = {
  image: 3,
  video: 1,
  autoRetry: true,
  maxRetries: 3,
  readTimeoutRetry: false,
};

function isSameCanvas(settings: CanvasSettingsConfig) {
  return (
    settings.enabled === canvasDefaults.enabled &&
    settings.maxBoardsPerUser === canvasDefaults.maxBoardsPerUser &&
    settings.maxNodesPerBoard === canvasDefaults.maxNodesPerBoard &&
    settings.maxSceneKb === canvasDefaults.maxSceneKb &&
    settings.maxPendingTasksPerBoard === canvasDefaults.maxPendingTasksPerBoard &&
    settings.allowedModelCodes.length === 0
  );
}

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

async function readCanvasModels() {
  const models = await requestJava<AdminGenerationModel[]>("/generation/admin/models");
  const imageModels = models.filter((model) => model.modelType === "image");
  const options: CanvasModelOption[] = imageModels.map((model) => {
    return {
      modelCode: model.modelCode,
      modelName: model.modelName,
      isEnabled: model.status === "enabled",
    };
  });

  return options;
}

export default async function AdminSettingsPage(props: AdminSettingsPageProps) {
  await requireAdmin();
  const params = await props.searchParams;
  const requestedSection = readParam(params, "section");
  const section = sectionIds.includes(requestedSection as SettingsSection)
    ? (requestedSection as SettingsSection)
    : "payment";
  const [
    smtpSettings,
    easyPaySettings,
    checkInSettings,
    announcementSettings,
    canvasSettings,
    generationSettings,
  ] = await Promise.all([
    requestJava<SmtpAdminConfig>("/admin/settings/smtp"),
    requestJava<EasyPayAdminConfig>("/admin/settings/easypay"),
    requestJava<CheckInSettingsConfig>("/admin/settings/checkin"),
    requestJava<AnnouncementSettingsConfig>("/admin/settings/announcement"),
    requestJava<CanvasSettingsConfig>("/admin/settings/canvas"),
    requestJava<GenerationSettingsConfig>("/admin/settings/generation"),
  ]);
  const canvasModels = section === "canvas" ? await readCanvasModels() : [];
  // AI 润色选择中转站连接
  const connections =
    section === "generation"
      ? await requestJava<GenerationProviderConnection[]>("/generation/admin/provider-connections")
      : [];

  // 第一步：按已加载的配置推导每个分类的状态。
  const isPaymentReady =
    easyPaySettings.enabled && Boolean(easyPaySettings.pid?.trim()) && easyPaySettings.hasKey;
  const isMailReady =
    smtpSettings.enabled && Boolean(smtpSettings.user?.trim()) && smtpSettings.hasPassword;
  const isCanvasDefault = isSameCanvas(canvasSettings);
  const isGenerationDefault =
    generationSettings.maxActiveImageTasksPerUser === generationDefaults.image &&
    generationSettings.maxActiveVideoTasksPerUser === generationDefaults.video &&
    (generationSettings.autoRetryEnabled ?? generationDefaults.autoRetry) ===
      generationDefaults.autoRetry &&
    (generationSettings.maxRetries ?? generationDefaults.maxRetries) ===
      generationDefaults.maxRetries &&
    (generationSettings.retryOnImageReadTimeout ?? generationDefaults.readTimeoutRetry) ===
      generationDefaults.readTimeoutRetry;

  // 第二步：组装分组导航。
  const groups: SectionGroup[] = [
    {
      title: "上线必填",
      items: [
        {
          id: "payment",
          label: "支付服务",
          status: isPaymentReady ? "configured" : "missing",
          icon: CreditCard,
        },
        {
          id: "smtp",
          label: "邮件服务",
          status: isMailReady ? "configured" : "missing",
          icon: Mail,
        },
      ],
    },
    {
      title: "运营",
      items: [
        {
          id: "announcement",
          label: "站内公告",
          status: announcementSettings.enabled ? "configured" : "off",
          icon: Megaphone,
        },
        { id: "checkin", label: "签到奖励", status: "configured", icon: Gift },
      ],
    },
    {
      title: "容量与限制",
      items: [
        {
          id: "generation",
          label: "生成并发",
          status: isGenerationDefault ? "default" : "configured",
          icon: Gauge,
        },
        {
          id: "canvas",
          label: "无限画布",
          status: isCanvasDefault ? "default" : "configured",
          icon: Frame,
        },
      ],
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
        <nav className={styles.nav} aria-label="系统设置分类">
          {groups.map((group) => (
            <div key={group.title} className={styles.navGroup}>
              <h2 className={styles.navTitle}>{group.title}</h2>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = section === item.id;
                return (
                  <Link
                    key={item.id}
                    href={`/admin/settings?section=${item.id}`}
                    className={clsx(styles.navLink, isActive && styles.navLinkActive)}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon size={15} aria-hidden="true" />
                    <span className={styles.navLabel}>{item.label}</span>
                    <span className={clsx(styles.navStatus, statusClasses[item.status])}>
                      {statusLabels[item.status]}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <section className={styles.content}>
          {section === "payment" ? <EasyPaySettingsForm initialSettings={easyPaySettings} /> : null}
          {section === "smtp" ? <SmtpSettingsForm initialSettings={smtpSettings} /> : null}
          {section === "checkin" ? <CheckInSettingsForm initialSettings={checkInSettings} /> : null}
          {section === "announcement" ? (
            <AnnouncementSettingsForm initialSettings={announcementSettings} />
          ) : null}
          {section === "canvas" ? (
            <CanvasSettingsForm initialSettings={canvasSettings} models={canvasModels} />
          ) : null}
          {section === "generation" ? (
            <GenerationSettingsForm
              initialSettings={generationSettings}
              connections={connections}
            />
          ) : null}
        </section>
      </div>
    </div>
  );
}
