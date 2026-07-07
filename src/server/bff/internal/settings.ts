import { getStore, maskSecret } from "@/server/bff/mock-store";
import { getJavaApiData, hasJavaApiBaseUrl } from "@/server/java-api";
import type {
  CheckInSettingsConfig,
  EasyPayAdminConfig,
  GenerationProviderAdminConfig,
  SmtpAdminConfig,
} from "@/types/admin";

export async function getGenerationProviderAdminConfig(): Promise<GenerationProviderAdminConfig> {
  const settings = getStore().settings.generation;
  return {
    enabled: settings.enabled,
    baseUrl: settings.baseUrl,
    model: settings.model,
    apiKeySource: settings.apiKey ? "database" : "none",
    hasApiKey: Boolean(settings.apiKey),
    apiKeyPreview: maskSecret(settings.apiKey),
  };
}

export async function updateGenerationProviderConfig(input: {
  enabled: boolean;
  baseUrl?: string;
  model: string;
  apiKey?: string;
  clearApiKey?: boolean;
}) {
  const settings = getStore().settings.generation;
  settings.enabled = input.enabled;
  settings.baseUrl = input.baseUrl?.trim() || null;
  settings.model = input.model.trim();
  if (input.clearApiKey) {
    settings.apiKey = null;
  } else if (input.apiKey?.trim()) {
    settings.apiKey = input.apiKey.trim();
  }
  return getGenerationProviderAdminConfig();
}

export async function getSmtpAdminConfig(): Promise<SmtpAdminConfig> {
  if (hasJavaApiBaseUrl()) {
    try {
      return await getJavaApiData<SmtpAdminConfig>("/v1/admin/settings/smtp");
    } catch {
      // Java 后端尚未完全接通时，保留 mock 数据兜底，避免后台页直接报错。
    }
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
}) {
  const settings = getStore().settings.easypay;
  settings.enabled = input.enabled;
  settings.apiBase = input.apiBase?.trim() || null;
  settings.pid = input.pid?.trim() || null;
  settings.notifyUrl = input.notifyUrl?.trim() || settings.notifyUrl;
  settings.returnUrl = input.returnUrl?.trim() || settings.returnUrl;
  if (input.clearKey) {
    settings.key = null;
  } else if (input.key?.trim()) {
    settings.key = input.key.trim();
  }
  return getEasyPayAdminConfig();
}

export async function getCheckInSettings(): Promise<CheckInSettingsConfig> {
  return {
    dailyCredits: getStore().settings.checkin.dailyCredits,
  };
}

export async function updateCheckInSettings(input: { dailyCredits: number }) {
  getStore().settings.checkin.dailyCredits = input.dailyCredits;
  return getCheckInSettings();
}
