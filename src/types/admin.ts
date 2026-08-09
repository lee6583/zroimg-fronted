type SecretSource = "database" | "env" | "none";

type GenerationProviderAdminConfig = {
  enabled: boolean;
  baseUrl: string | null;
  model: string;
  apiKeySource: SecretSource;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
};

type VideoProviderAdminConfig = {
  enabled: boolean;
  baseUrl: string | null;
  model: string;
  publicBaseUrl: string | null;
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

type SaveVideoSettingsRequest = {
  enabled: boolean;
  baseUrl: string;
  model: string;
  publicBaseUrl: string;
  apiKey: string;
  clearApiKey: boolean;
};

type SaveVideoSettingsResponse = {
  settings: VideoProviderAdminConfig;
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

type ResetUserPasswordRequest = {
  password: string;
  confirmPassword: string;
};

type ResetUserPasswordResponse = {
  ok?: boolean;
};

type AdminUser = {
  id: string;
  username: string;
  email: string;
  bio: string;
  role: string;
  status: "active" | "banned";
  totalPoints: number;
  createdAt: string;
};

type AdminUserPageQuery = {
  page: number;
  pageSize: number;
  q?: string;
  status?: "active" | "banned";
};

type AdminUserPage = {
  total: number;
  pages: number;
  list: AdminUser[];
};

type AdminPointsFlow = {
  id: string;
  amount: number;
  afterPoints: number;
  remark: string;
  createdAt: string;
};

type AdminGenerationTask = {
  id: string;
  taskNo: string;
  userEmail: string;
  prompt: string;
  status: string;
  mode: string;
  model: string;
  size: string;
  quality: string;
  requiredPoints: number;
  outputCount: number;
  failReason: string | null;
  createdAt: string;
};

type AdminGenerationPage = {
  total: number;
  pages: number;
  list: AdminGenerationTask[];
};

type AdminOverviewTicket = {
  id: number;
  subject: string;
  status: string;
  email: string | null;
  createdAt: string;
};

type AdminOverview = {
  users: number;
  tasks: number;
  orders: number;
  failedTasks: number;
  openTickets: number;
  latestTickets: AdminOverviewTicket[];
};

type AdminAuditLog = {
  id: number;
  adminUserId: number;
  adminEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  detailJson: string | null;
  createdAt: string;
};

type AdminAuditLogPage = {
  total: number;
  pages: number;
  list: AdminAuditLog[];
};

type AdminGenerationModelMode = {
  id?: number;
  modeCode: string;
  modeName: string;
  status: "enabled" | "disabled";
  sortOrder: number;
};

type AdminGenerationModelParam = {
  id?: number;
  modeCode: string;
  paramType: "ratio" | "resolution" | "quality" | "format" | "count" | "duration" | "audio";
  paramValue: string;
  paramLabel: string;
  defaultFlag: number;
  sortOrder: number;
};

type AdminGenerationModelPrice = {
  id?: number;
  modeCode: string;
  resolution: string;
  quality: string;
  points: number;
  priceVersion?: string;
  status: "enabled" | "disabled";
};

type AdminGenerationModel = {
  id: string;
  modelCode: string;
  modelName: string;
  provider: string;
  modelType: "image" | "video";
  status: "enabled" | "disabled";
  defaultFlag: number;
  sortOrder: number;
  remark: string | null;
  priceVersion: string;
  createdAt: string | null;
  updatedAt: string | null;
  modes: AdminGenerationModelMode[];
  params: AdminGenerationModelParam[];
  prices: AdminGenerationModelPrice[];
};

type SaveAdminGenerationModelRequest = {
  modelCode: string;
  modelName: string;
  provider: string;
  modelType: "image" | "video";
  status: "enabled" | "disabled";
  defaultFlag: number;
  sortOrder: number;
  remark: string;
  priceVersion: string;
  priceChangeReason: string;
  modes: AdminGenerationModelMode[];
  params: AdminGenerationModelParam[];
  prices: AdminGenerationModelPrice[];
};

type AdminGenerationModelResponse = {
  model: AdminGenerationModel;
};

export type {
  SecretSource,
  GenerationProviderAdminConfig,
  VideoProviderAdminConfig,
  SmtpAdminConfig,
  EasyPayAdminConfig,
  CheckInSettingsConfig,
  SaveGenerationSettingsRequest,
  SaveGenerationSettingsResponse,
  SaveVideoSettingsRequest,
  SaveVideoSettingsResponse,
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
  ResetUserPasswordRequest,
  ResetUserPasswordResponse,
  AdminUser,
  AdminUserPageQuery,
  AdminUserPage,
  AdminPointsFlow,
  AdminGenerationTask,
  AdminGenerationPage,
  AdminOverviewTicket,
  AdminOverview,
  AdminAuditLog,
  AdminAuditLogPage,
  AdminGenerationModelMode,
  AdminGenerationModelParam,
  AdminGenerationModelPrice,
  AdminGenerationModel,
  SaveAdminGenerationModelRequest,
  AdminGenerationModelResponse,
};
