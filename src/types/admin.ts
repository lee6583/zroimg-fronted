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

type GenerationModelAdapter = "openai" | "grok";

type LegacyGenerationModelAdapter = GenerationModelAdapter | "generic-video";

type GenerationModelType = "image" | "video";

type GenerationModelCatalogItem = {
  modelCode: string;
  capabilityProfile: string;
  modelName: string;
  modelType: GenerationModelType;
  adapter: GenerationModelAdapter;
  defaultApiBaseUrl: string;
  imageToImageSupported: boolean;
  imageToVideoSupported: boolean;
  ratios: string[];
  qualities: string[];
  resolutions: string[];
  minDuration: number | null;
  maxDuration: number | null;
  maxCount: number;
  defaultPoints: Record<string, number>;
  defaultPointsPerSecond: Record<string, number>;
  defaultReferencePoints: Record<string, number>;
};

type GenerationProviderConnection = {
  id: string;
  name: string;
  adapter: GenerationModelAdapter;
  apiBaseUrl: string;
  status: "enabled" | "disabled";
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  modelCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type DiscoveredProviderModel = {
  id: string;
  displayName: string;
  ownedBy: string;
  object: string;
};

type SaveProviderConnectionRequest = {
  name: string;
  adapter: GenerationModelAdapter;
  apiBaseUrl: string;
  apiKey: string;
  clearApiKey: boolean;
  status: "enabled" | "disabled";
};

type DiscoverProviderModelsRequest = {
  adapter: GenerationModelAdapter;
  apiBaseUrl: string;
  apiKey: string;
};

type ProviderConnectionsResponse = {
  connections: GenerationProviderConnection[];
};

type ProviderConnectionResponse = {
  connection: GenerationProviderConnection;
};

type DiscoveredProviderModelsResponse = {
  models: DiscoveredProviderModel[];
};

type AdminGenerationModel = {
  id: string;
  modelCode: string;
  modelName: string;
  modelType: GenerationModelType;
  adapter: LegacyGenerationModelAdapter;
  connectionId: string | null;
  connectionName: string | null;
  providerModelCode: string;
  capabilityProfile: string;
  verificationStatus: "verified" | "unverified";
  verifiedAt: string | null;
  apiBaseUrl: string | null;
  hasApiKey: boolean;
  apiKeyPreview: string | null;
  status: "enabled" | "disabled";
  defaultFlag: number;
  sortOrder: number;
  imageToImageEnabled: boolean;
  imageToVideoEnabled: boolean;
  supportedRatios: string[];
  supportedQualities: string[];
  supportedResolutions: string[];
  minDuration: number | null;
  maxDuration: number | null;
  maxCount: number;
  pointsByQuality: Record<string, number>;
  pointsPerSecondByResolution: Record<string, number>;
  referencePointsByResolution: Record<string, number>;
  createdAt: string | null;
  updatedAt: string | null;
};

type SaveAdminGenerationModelCommon = {
  modelName: string;
  status: "enabled" | "disabled";
  defaultFlag: number;
  sortOrder: number;
  ratios: string[];
};

type SaveAdminGenerationModelDynamicBase = SaveAdminGenerationModelCommon & {
  connectionId: string;
  providerModelCode: string;
  capabilityProfile: string;
};

type SaveAdminGenerationModelLegacyBase = SaveAdminGenerationModelCommon & {
  modelCode: string;
  adapter: LegacyGenerationModelAdapter;
  apiBaseUrl: string;
  apiKey: string;
  clearApiKey: boolean;
};

type SaveAdminImageModelRequest = SaveAdminGenerationModelDynamicBase & {
  modelType: "image";
  imageToImageEnabled: boolean;
  qualities: string[];
  maxCount: number;
  qualityPrices: Array<{ quality: string; points: number }>;
};

type SaveAdminVideoModelRequest = SaveAdminGenerationModelDynamicBase & {
  modelType: "video";
  imageToVideoEnabled: boolean;
  resolutions: string[];
  minDuration: number;
  maxDuration: number;
  videoPrices: Array<{
    resolution: string;
    pointsPerSecond: number;
    referencePoints: number;
  }>;
};

type SaveAdminLegacyImageModelRequest = SaveAdminGenerationModelLegacyBase & {
  modelType: "image";
  imageToImageEnabled: boolean;
  qualities: string[];
  maxCount: number;
  qualityPrices: Array<{ quality: string; points: number }>;
};

type SaveAdminLegacyVideoModelRequest = SaveAdminGenerationModelLegacyBase & {
  modelType: "video";
  imageToVideoEnabled: boolean;
  resolutions: string[];
  minDuration: number;
  maxDuration: number;
  videoPrices: Array<{
    resolution: string;
    pointsPerSecond: number;
    referencePoints: number;
  }>;
};

type SaveAdminGenerationModelRequest =
  | SaveAdminImageModelRequest
  | SaveAdminVideoModelRequest
  | SaveAdminLegacyImageModelRequest
  | SaveAdminLegacyVideoModelRequest;

type AdminGenerationModelsResponse = {
  models: AdminGenerationModel[];
  catalog: GenerationModelCatalogItem[];
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
  GenerationModelAdapter,
  LegacyGenerationModelAdapter,
  GenerationModelType,
  GenerationModelCatalogItem,
  GenerationProviderConnection,
  DiscoveredProviderModel,
  SaveProviderConnectionRequest,
  DiscoverProviderModelsRequest,
  ProviderConnectionsResponse,
  ProviderConnectionResponse,
  DiscoveredProviderModelsResponse,
  AdminGenerationModel,
  SaveAdminGenerationModelCommon,
  SaveAdminGenerationModelDynamicBase,
  SaveAdminGenerationModelLegacyBase,
  SaveAdminLegacyImageModelRequest,
  SaveAdminLegacyVideoModelRequest,
  SaveAdminGenerationModelRequest,
  AdminGenerationModelsResponse,
  AdminGenerationModelResponse,
};
