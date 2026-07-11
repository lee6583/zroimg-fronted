export type SecretSource = "database" | "env" | "none";

export type GenerationProviderAdminConfig = {
  enabled: boolean;
  baseUrl: string | null;
  model: string;
  apiKeySource: SecretSource;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
};

export type SmtpAdminConfig = {
  enabled: boolean;
  host: string | null;
  port: number;
  secure: boolean;
  user: string | null;
  passwordSource: SecretSource;
  hasPassword: boolean;
  passwordPreview: string | null;
  from: string;
};

export type EasyPayAdminConfig = {
  enabled: boolean;
  apiBase: string | null;
  pid: string | null;
  keySource: SecretSource;
  hasKey: boolean;
  keyPreview: string | null;
  notifyUrl: string;
  returnUrl: string;
};

export type CheckInSettingsConfig = {
  dailyCredits: number;
};

export type SaveGenerationSettingsRequest = {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
  clearApiKey: boolean;
};

export type SaveGenerationSettingsResponse = {
  settings: GenerationProviderAdminConfig;
};

export type SaveSmtpSettingsRequest = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  clearPassword: boolean;
  from: string;
};

export type SaveSmtpSettingsResponse = {
  settings: SmtpAdminConfig;
};

export type TestSmtpSettingsRequest = {
  mode: "connection" | "email";
  email?: string;
};

export type TestSmtpSettingsResponse = {
  ok?: boolean;
};

export type SaveEasyPaySettingsRequest = {
  enabled: boolean;
  apiBase: string;
  pid: string;
  key: string;
  clearKey: boolean;
  notifyUrl: string;
  returnUrl: string;
};

export type SaveEasyPaySettingsResponse = {
  settings: EasyPayAdminConfig;
};

export type SaveCheckInSettingsRequest = {
  dailyCredits: number;
};

export type SaveCheckInSettingsResponse = {
  settings: CheckInSettingsConfig;
};

export type AdjustUserCreditsRequest = {
  amount: number;
  reason: string;
};

export type AdjustUserCreditsResponse = {
  ok?: boolean;
};

export type UpdateUserStatusRequest = {
  status: "active" | "banned";
};

export type UpdateUserStatusResponse = {
  ok?: boolean;
};
