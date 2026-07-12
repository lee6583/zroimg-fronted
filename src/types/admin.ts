type SecretSource = "database" | "env" | "none";

type GenerationProviderAdminConfig = {
  enabled: boolean;
  baseUrl: string | null;
  model: string;
  apiKeySource: SecretSource;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
};

type SmtpAdminConfig = {
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

type EasyPayAdminConfig = {
  enabled: boolean;
  apiBase: string | null;
  pid: string | null;
  keySource: SecretSource;
  hasKey: boolean;
  keyPreview: string | null;
  notifyUrl: string;
  returnUrl: string;
};

type CheckInSettingsConfig = {
  dailyCredits: number;
};

type SaveGenerationSettingsRequest = {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
  clearApiKey: boolean;
};

type SaveGenerationSettingsResponse = {
  settings: GenerationProviderAdminConfig;
};

type SaveSmtpSettingsRequest = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  clearPassword: boolean;
  from: string;
};

type SaveSmtpSettingsResponse = {
  settings: SmtpAdminConfig;
};

type TestSmtpSettingsRequest = {
  mode: "connection" | "email";
  email?: string;
};

type TestSmtpSettingsResponse = {
  ok?: boolean;
};

type SaveEasyPaySettingsRequest = {
  enabled: boolean;
  apiBase: string;
  pid: string;
  key: string;
  clearKey: boolean;
  notifyUrl: string;
  returnUrl: string;
};

type SaveEasyPaySettingsResponse = {
  settings: EasyPayAdminConfig;
};

type SaveCheckInSettingsRequest = {
  dailyCredits: number;
};

type SaveCheckInSettingsResponse = {
  settings: CheckInSettingsConfig;
};

type AdjustUserCreditsRequest = {
  amount: number;
  reason: string;
};

type AdjustUserCreditsResponse = {
  ok?: boolean;
};

type UpdateUserStatusRequest = {
  status: "active" | "banned";
};

type UpdateUserStatusResponse = {
  ok?: boolean;
};

export type {
  SecretSource,
  GenerationProviderAdminConfig,
  SmtpAdminConfig,
  EasyPayAdminConfig,
  CheckInSettingsConfig,
  SaveGenerationSettingsRequest,
  SaveGenerationSettingsResponse,
  SaveSmtpSettingsRequest,
  SaveSmtpSettingsResponse,
  TestSmtpSettingsRequest,
  TestSmtpSettingsResponse,
  SaveEasyPaySettingsRequest,
  SaveEasyPaySettingsResponse,
  SaveCheckInSettingsRequest,
  SaveCheckInSettingsResponse,
  AdjustUserCreditsRequest,
  AdjustUserCreditsResponse,
  UpdateUserStatusRequest,
  UpdateUserStatusResponse,
};
