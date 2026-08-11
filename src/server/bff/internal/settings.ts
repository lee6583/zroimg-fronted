import { getStore, maskSecret } from "@/server/bff/mock-store";
import { isJavaBffEnabled, isMockBffEnabled } from "@/server/env";
import { getJavaApiData, requestJavaApiData } from "@/server/java-api";
import type {
  CheckInSettingsConfig,
  EasyPayAdminConfig,
  SmtpAdminConfig,
  VideoProviderAdminConfig,
} from "@/types/admin";
import type { AnnouncementSettingsConfig, PublicAnnouncement } from "@/types/announcement";

function defaultAnnouncementSettings() {
  return {
    enabled: true,
    title: "系统公告",
    content: "欢迎使用 ZroImg。当前为前端联调环境，部分功能仍使用 mock 数据。",
    updatedAt: new Date(),
  };
}

export async function getVideoConfig(): Promise<VideoProviderAdminConfig> {
  if (isJavaBffEnabled()) {
    return getJavaApiData<VideoProviderAdminConfig>("/admin/settings/video");
  }

  const settings = getStore().settings.generation;
  return {
    enabled: false,
    baseUrl: settings.baseUrl,
    model: "video-generic",
    publicBaseUrl: null,
    apiKeySource: "none",
    hasApiKey: false,
    apiKeyPreview: null,
  };
}

export async function updateVideoConfig(input: {
  enabled: boolean;
  baseUrl?: string;
  model: string;
  publicBaseUrl?: string;
  apiKey?: string;
  clearApiKey?: boolean;
}) {
  if (isJavaBffEnabled()) {
    return requestJavaApiData<VideoProviderAdminConfig>("/admin/settings/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  return getVideoConfig();
}

export async function getSmtpAdminConfig(): Promise<SmtpAdminConfig> {
  if (!isMockBffEnabled()) {
    return getJavaApiData<SmtpAdminConfig>("/admin/settings/smtp");
  }

  const settings = getStore().settings.smtp;
  return {
    enabled: settings.enabled,
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    user: settings.user,
    passwordSource: settings.password ? "database" : "none",
    hasPassword: Boolean(settings.password),
    passwordPreview: maskSecret(settings.password),
    from: settings.from,
  };
}

export async function updateSmtpSettings(input: {
  enabled: boolean;
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  clearPassword?: boolean;
  from: string;
}) {
  if (isJavaBffEnabled()) {
    return requestJavaApiData<SmtpAdminConfig>("/admin/settings/smtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  const settings = getStore().settings.smtp;
  settings.enabled = input.enabled;
  settings.host = input.host?.trim() || null;
  settings.port = input.port;
  settings.secure = input.secure;
  settings.user = input.user?.trim() || null;
  settings.from = input.from.trim();
  if (input.clearPassword) {
    settings.password = null;
  } else if (input.password?.trim()) {
    settings.password = input.password.trim();
  }
  return getSmtpAdminConfig();
}

export async function getEasyPayAdminConfig(): Promise<EasyPayAdminConfig> {
  if (isJavaBffEnabled()) {
    return getJavaApiData<EasyPayAdminConfig>("/admin/settings/easypay");
  }

  const settings = getStore().settings.easypay;
  return {
    enabled: settings.enabled,
    apiBase: settings.apiBase,
    pid: settings.pid,
    keySource: settings.key ? "database" : "none",
    hasKey: Boolean(settings.key),
    keyPreview: maskSecret(settings.key),
    notifyUrl: settings.notifyUrl,
    returnUrl: settings.returnUrl,
    feeRatePercent: settings.feeRatePercent,
    timeoutMinutes: settings.timeoutMinutes,
    creditsPerYuan: settings.creditsPerYuan,
    maxPendingOrders: settings.maxPendingOrders,
    minAmountCent: settings.minAmountCent,
    maxAmountCent: settings.maxAmountCent,
  };
}

export async function updateEasyPaySettings(input: {
  enabled: boolean;
  apiBase?: string;
  pid?: string;
  key?: string;
  clearKey?: boolean;
  notifyUrl?: string;
  returnUrl?: string;
  feeRatePercent: number;
  timeoutMinutes: number;
  creditsPerYuan: number;
  maxPendingOrders: number;
  minAmountCent: number;
  maxAmountCent: number;
}) {
  if (isJavaBffEnabled()) {
    return requestJavaApiData<EasyPayAdminConfig>("/admin/settings/easypay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  const settings = getStore().settings.easypay;
  settings.enabled = input.enabled;
  settings.apiBase = input.apiBase?.trim() || null;
  settings.pid = input.pid?.trim() || null;
  settings.notifyUrl = input.notifyUrl?.trim() || settings.notifyUrl;
  settings.returnUrl = input.returnUrl?.trim() || settings.returnUrl;
  settings.feeRatePercent = input.feeRatePercent;
  settings.timeoutMinutes = input.timeoutMinutes;
  settings.creditsPerYuan = input.creditsPerYuan;
  settings.maxPendingOrders = input.maxPendingOrders;
  settings.minAmountCent = input.minAmountCent;
  settings.maxAmountCent = input.maxAmountCent;
  if (input.clearKey) {
    settings.key = null;
  } else if (input.key?.trim()) {
    settings.key = input.key.trim();
  }
  return getEasyPayAdminConfig();
}

export async function getCheckInSettings(): Promise<CheckInSettingsConfig> {
  if (isJavaBffEnabled()) {
    return getJavaApiData<CheckInSettingsConfig>("/admin/settings/checkin");
  }

  return {
    dailyCredits: getStore().settings.checkin.dailyCredits,
  };
}

export async function updateCheckInSettings(input: { dailyCredits: number }) {
  if (isJavaBffEnabled()) {
    return requestJavaApiData<CheckInSettingsConfig>("/admin/settings/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  getStore().settings.checkin.dailyCredits = input.dailyCredits;
  return getCheckInSettings();
}

function toAnnouncementConfig(): AnnouncementSettingsConfig {
  const store = getStore();

  if (!store.settings.announcement) {
    store.settings.announcement = defaultAnnouncementSettings();
  }

  const settings = store.settings.announcement;

  return {
    enabled: settings.enabled,
    title: settings.title,
    content: settings.content,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function getAnnouncementSettings(): Promise<AnnouncementSettingsConfig> {
  if (isJavaBffEnabled()) {
    return getJavaApiData<AnnouncementSettingsConfig>("/admin/settings/announcement");
  }

  return toAnnouncementConfig();
}

export async function getPublicAnnouncement(): Promise<PublicAnnouncement> {
  if (isJavaBffEnabled()) {
    return getJavaApiData<PublicAnnouncement>("/content/public/announcement");
  }

  if (!isMockBffEnabled()) {
    return {
      enabled: false,
      title: "",
      content: "",
      updatedAt: "disabled",
    };
  }

  return toAnnouncementConfig();
}

export async function updateAnnouncementSettings(input: {
  enabled: boolean;
  title: string;
  content: string;
}) {
  if (isJavaBffEnabled()) {
    return requestJavaApiData<AnnouncementSettingsConfig>("/admin/settings/announcement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  }

  const store = getStore();

  if (!store.settings.announcement) {
    store.settings.announcement = defaultAnnouncementSettings();
  }

  const settings = store.settings.announcement;
  settings.enabled = input.enabled;
  settings.title = input.title.trim();
  settings.content = input.content.trim();
  settings.updatedAt = new Date();

  return getAnnouncementSettings();
}
