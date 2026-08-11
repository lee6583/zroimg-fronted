type SecretSource = "database" | "env" | "none";

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
  feeRatePercent: number;
  timeoutMinutes: number;
  creditsPerYuan: number;
  maxPendingOrders: number;
  minAmountCent: number;
  maxAmountCent: number;
};

type CheckInSettingsConfig = {
  dailyCredits: number;
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
  feeRatePercent: number;
  timeoutMinutes: number;
  creditsPerYuan: number;
  maxPendingOrders: number;
  minAmountCent: number;
  maxAmountCent: number;
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

type DeleteUserResponse = {
  ok?: boolean;
};

type AdminUser = {
  id: string;
  username: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
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
  username: string;
  prompt: string;
  status: string;
  modelType: "image" | "video";
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
  id: string;
  subject: string;
  status: string;
  username: string | null;
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

type ImageModelAdapter = "openai" | "grok";

type ImageModelCatalogItem = {
  modelCode: string;
  modelName: string;
  adapter: ImageModelAdapter;
  defaultApiBaseUrl: string;
  imageToImageSupported: boolean;
  ratios: string[];
  qualities: string[];
  maxCount: number;
  defaultPoints: Record<string, number>;
};

type AdminGenerationModel = {
  id: string;
  modelCode: string;
  modelName: string;
  adapter: ImageModelAdapter;
  apiBaseUrl: string;
  hasApiKey: boolean;
  status: "enabled" | "disabled";
  defaultFlag: number;
  sortOrder: number;
  imageToImageEnabled: boolean;
  supportedRatios: string[];
  supportedQualities: string[];
  maxCount: number;
  pointsByQuality: Record<string, number>;
  createdAt: string | null;
  updatedAt: string | null;
};

type SaveAdminGenerationModelRequest = {
  modelCode: string;
  adapter: ImageModelAdapter;
  apiBaseUrl: string;
  apiKey: string;
  clearApiKey: boolean;
  status: "enabled" | "disabled";
  defaultFlag: number;
  sortOrder: number;
  imageToImageEnabled: boolean;
  ratios: string[];
  qualities: string[];
  maxCount: number;
  qualityPrices: Array<{ quality: string; points: number }>;
};

type AdminGenerationModelsResponse = {
  models: AdminGenerationModel[];
  catalog: ImageModelCatalogItem[];
};

type AdminGenerationModelResponse = {
  model: AdminGenerationModel;
};

export type {
  SecretSource,
  VideoProviderAdminConfig,
  SmtpAdminConfig,
  EasyPayAdminConfig,
  CheckInSettingsConfig,
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
  DeleteUserResponse,
  AdminUser,
  AdminUserPageQuery,
  AdminUserPage,
  AdminPointsFlow,
  AdminGenerationTask,
  AdminGenerationPage,
  AdminOverviewTicket,
  AdminOverview,
  ImageModelAdapter,
  ImageModelCatalogItem,
  AdminGenerationModel,
  SaveAdminGenerationModelRequest,
  AdminGenerationModelsResponse,
  AdminGenerationModelResponse,
};
