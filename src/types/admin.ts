import type { PageResult } from "@/types/api";
import type { GalleryCategory, GalleryStatus } from "@/types/gallery";

type SecretSource = "database" | "env" | "none";

// /admin/settings/*
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
  fromName: string;
  fromEmail: string;
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
  effectiveNotifyUrl: string;
  effectiveReturnUrl: string;
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

type AnnouncementSettingsConfig = {
  enabled: boolean;
  title: string;
  content: string;
  updatedAt: string;
};

type CanvasSettingsConfig = {
  enabled: boolean;
  maxBoardsPerUser: number;
  maxNodesPerBoard: number;
  maxSceneKb: number;
  maxPendingTasksPerBoard: number;
  allowedModelCodes: string[];
};

type DocsItem = {
  id: string;
  title: string;
  body: string;
};

type DocsGroup = {
  title: string;
  items: DocsItem[];
};

type DocsConfig = {
  title: string;
  description: string;
  groups: DocsGroup[];
};

type SaveSmtpSettingsRequest = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  clearPassword: boolean;
  fromName: string;
  fromEmail: string;
};

type TestSmtpSettingsRequest = {
  mode: "connection" | "email";
  email?: string;
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

type SaveCheckInSettingsRequest = {
  dailyCredits: number;
};

type SaveAnnouncementSettingsRequest = {
  enabled: boolean;
  title: string;
  content: string;
};

type SaveCanvasSettingsRequest = CanvasSettingsConfig;

type GenerationSettingsConfig = {
  maxActiveImageTasksPerUser: number;
  maxActiveVideoTasksPerUser: number;
  imageConcurrency: number;
  videoConcurrency: number;
  autoRetryEnabled?: boolean;
  maxRetries?: number;
  retryOnImageReadTimeout?: boolean;
};

type SaveGenerationSettingsRequest = {
  maxActiveImageTasksPerUser: number;
  maxActiveVideoTasksPerUser: number;
  autoRetryEnabled: boolean;
  maxRetries: number;
  retryOnImageReadTimeout: boolean;
};

// auth AdminUserVO
type AdminUser = {
  id: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  status: "active" | "banned";
  totalPoints: number;
  createdAt: string;
};

type AdminUserDetail = AdminUser & {
  maxActiveImageTasks: number | null;
  maxActiveVideoTasks: number | null;
  effectiveMaxActiveImageTasks: number;
  effectiveMaxActiveVideoTasks: number;
};

type UpdateGenerationLimitsRequest = {
  maxActiveImageTasks: number | null;
  maxActiveVideoTasks: number | null;
};

type UpdateUserStatusRequest = {
  status: "active" | "banned";
};

type UpdateUserPasswordRequest = {
  password: string;
};

// points PointsFlowVO / AdjustPointsDTO / AdjustPointsVO
type AdminPointsFlow = {
  id: string;
  flowNo: string;
  sourceType: string;
  changeType: string;
  amount: number;
  beforePoints: number;
  afterPoints: number;
  remark: string | null;
  createdAt: string;
};

type AdjustPointsRequest = {
  amount: number;
};

type AdjustPointsResponse = {
  balance: number;
};

// order PointsPackageVO / AdminCreatePointsPackageDTO
type AdminPackage = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  amountCent: number;
  amountText: string;
  credits: number;
  highlights: string[] | null;
  recommended: boolean;
  enabled: boolean;
  sort: number;
};

type SavePackageRequest = {
  code: string;
  name: string;
  description: string;
  amountCent: number;
  credits: number;
  highlights: string[];
  recommended: boolean;
  enabled: boolean;
  sort: number;
};

// order AdminRechargeOrderVO
type AdminRechargeOrder = {
  orderNo: string;
  packageId: string | null;
  packageCode: string | null;
  packageName: string | null;
  packageDescription: string | null;
  amountCent: number;
  amountText: string;
  rechargeAmountCent: number | null;
  feeAmountCent: number | null;
  credits: number;
  payChannel: string | null;
  payChannelText: string | null;
  payStatus: string;
  creditsStatus: string;
  displayStatus: string;
  thirdTradeNo: string | null;
  createTime: string;
  payTime: string | null;
  expireTime: string | null;
  userId: string;
  username: string | null;
  creditsErrorReason: string | null;
  closeTime: string | null;
};

// feedback AdminFeedbackTicketVO
type AdminTicketUser = {
  id: string;
  email: string;
  name: string;
};

type AdminTicketMessage = {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
  authorName: string | null;
};

type AdminTicketAttachment = {
  id: string;
  mediaId: string;
  fileName: string | null;
  url: string;
};

type AdminTicket = {
  id: string;
  type: string;
  status: string;
  subject: string;
  content: string;
  createTime: string;
  updateTime: string;
  user: AdminTicketUser | null;
  messages: AdminTicketMessage[];
  attachments: AdminTicketAttachment[];
};

type ReplyTicketRequest = {
  body: string;
  status: string;
};

type UpdateTicketStatusRequest = {
  status: string;
};

type TicketOperationResponse = {
  ok: boolean;
};

// generation GenerationTaskVO
type AdminTaskResult = {
  id: string;
  resultType: string;
  mediaAssetId: string | null;
  resultUrl: string;
  sortOrder: number;
};

type AdminGenerationTask = {
  id: string;
  taskNo: string;
  modelCode: string;
  modelName: string | null;
  provider: string | null;
  userEmail: string | null;
  username: string | null;
  modelType: string;
  mode: string;
  prompt: string;
  referenceImageUrl: string | null;
  referenceMediaId: string | null;
  maskMediaId?: string | null;
  canvasId?: string | null;
  ratio: string | null;
  resolution: string | null;
  quality: string | null;
  format: string | null;
  count: number | null;
  durationSeconds: number | null;
  audio: boolean | null;
  priceVersion: string | null;
  unitPoints: number | null;
  billingUnit: string | null;
  referencePoints: number | null;
  requiredPoints: number;
  status: string;
  failReason: string | null;
  results: AdminTaskResult[] | null;
  createTime: string;
  updateTime: string | null;
  finishTime: string | null;
  attemptCount?: number;
  maxAttempts?: number;
  retrying?: boolean;
  nextAttemptTime?: string | null;
  lastError?: string | null;
};

// generation GenerationTaskAttemptVO
type AdminTaskAttempt = {
  attemptNo: number;
  retryable: boolean;
  errorCategory: string | null;
  httpStatus: number | null;
  errorMessage: string | null;
  startedTime: string | null;
  finishedTime: string | null;
};

type GenerationQueueStats = {
  imagePending: number;
  imageProcessing: number;
  videoPending: number;
  videoProcessing: number;
  imageConcurrency: number;
  videoConcurrency: number;
};

// dashboard AdminDashboardSummaryVO.KpiVO：changePercent 在昨日为 0 时为 null
type AdminDashboardKpi = {
  today: number;
  yesterday: number;
  change: number;
  changePercent: number | null;
};

// dashboard AdminDashboardSummaryVO
type AdminDashboardSummary = {
  date: string;
  revenue: AdminDashboardKpi;
  orders: AdminDashboardKpi;
  tasks: AdminDashboardKpi;
  users: AdminDashboardKpi;
  failedTasks24h: number;
  pendingGallery: number;
  openTickets: number;
};

type AdminDashboardMetric = "revenue" | "orders" | "tasks" | "users";

// dashboard AdminDashboardTrendVO.PointVO
type AdminDashboardTrendPoint = {
  date: string;
  revenue: number;
  orders: number;
  tasks: number;
  users: number;
};

// dashboard AdminDashboardTrendVO
type AdminDashboardTrend = {
  days: number;
  points: AdminDashboardTrendPoint[];
};

// dashboard AdminModelUsageVO
type AdminModelUsage = {
  modelCode: string;
  modelName: string;
  modelType: "image" | "video";
  total: number;
  succeeded: number;
  failed: number;
  running: number;
  successRate: number | null;
  points: number;
};

// gallery AdminGallerySubmissionVO
type AdminGallerySubmission = {
  id: string;
  generatedImageId: string;
  userId: string;
  username: string | null;
  email: string | null;
  prompt: string;
  title: string | null;
  category: GalleryCategory;
  status: GalleryStatus;
  rejectReason: string | null;
  submitTime: string | null;
  reviewTime: string | null;
  reviewerId: string | null;
  modelCode: string | null;
  modelName: string | null;
  width: number | null;
  height: number | null;
  imageUrl: string;
};

type AdminGallerySubmissionQuery = {
  pageNo?: number;
  pageSize?: number;
  status?: GalleryStatus;
  category?: GalleryCategory;
  userId?: string;
  keyword?: string;
};

type ApproveGallerySubmissionRequest = {
  category?: GalleryCategory;
  title?: string;
};

type GalleryReviewReasonRequest = {
  reason: string;
};

type BatchApproveGalleryRequest = {
  ids: string[];
};

type BatchApproveGalleryResult = {
  approved: number;
  skipped: number;
};

type GalleryReviewStats = Record<GalleryStatus, number>;

// generation models / provider connections
type GenerationModelAdapter = "openai" | "grok" | "gemini";

type GenerationModelType = "image" | "video";

type GenerationModelCatalogItem = {
  capabilityProfile: string;
  modelName: string;
  modelType: GenerationModelType;
  adapter: GenerationModelAdapter;
  imageToImageSupported: boolean;
  imageToVideoSupported: boolean;
  inpaintSupported: boolean;
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

type AdminGenerationModel = {
  id: string;
  modelCode: string;
  modelName: string;
  modelType: GenerationModelType;
  adapter: GenerationModelAdapter;
  connectionId: string | null;
  connectionName: string | null;
  providerModelCode: string;
  capabilityProfile: string;
  verificationStatus: "verified" | "unverified";
  verifiedAt: string | null;
  status: "enabled" | "disabled";
  defaultFlag: number;
  sortOrder: number;
  imageToImageEnabled: boolean;
  imageToVideoEnabled: boolean;
  inpaintEnabled: boolean;
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

type ImageQualityPrice = {
  quality: string;
  points: number;
};

type VideoResolutionPrice = {
  resolution: string;
  pointsPerSecond: number;
  referencePoints: number;
};

type SaveModelBase = {
  connectionId: string;
  providerModelCode: string;
  capabilityProfile: string;
  modelName: string;
  status: "enabled" | "disabled";
  defaultFlag: number;
  sortOrder: number;
  ratios: string[];
};

type ImageModelFields = {
  modelType: "image";
  imageToImageEnabled: boolean;
  inpaintEnabled: boolean;
  qualities: string[];
  maxCount: number;
  qualityPrices: ImageQualityPrice[];
};

type VideoModelFields = {
  modelType: "video";
  imageToVideoEnabled: boolean;
  resolutions: string[];
  minDuration: number;
  maxDuration: number;
  videoPrices: VideoResolutionPrice[];
};

type SaveModelRequest = (SaveModelBase & ImageModelFields) | (SaveModelBase & VideoModelFields);

type AdminUserPage = PageResult<AdminUser>;
type AdminPointsFlowPage = PageResult<AdminPointsFlow>;
type AdminRechargeOrderPage = PageResult<AdminRechargeOrder>;
type AdminTicketPage = PageResult<AdminTicket>;
type AdminGenerationTaskPage = PageResult<AdminGenerationTask>;

export type {
  SecretSource,
  SmtpAdminConfig,
  EasyPayAdminConfig,
  CheckInSettingsConfig,
  AnnouncementSettingsConfig,
  CanvasSettingsConfig,
  DocsItem,
  DocsGroup,
  DocsConfig,
  SaveSmtpSettingsRequest,
  TestSmtpSettingsRequest,
  SaveEasyPaySettingsRequest,
  SaveCheckInSettingsRequest,
  SaveAnnouncementSettingsRequest,
  SaveCanvasSettingsRequest,
  GenerationSettingsConfig,
  SaveGenerationSettingsRequest,
  AdminUser,
  AdminUserDetail,
  UpdateGenerationLimitsRequest,
  AdminUserPage,
  UpdateUserStatusRequest,
  UpdateUserPasswordRequest,
  AdminPointsFlow,
  AdminPointsFlowPage,
  AdjustPointsRequest,
  AdjustPointsResponse,
  AdminPackage,
  SavePackageRequest,
  AdminRechargeOrder,
  AdminRechargeOrderPage,
  AdminTicketUser,
  AdminTicketMessage,
  AdminTicketAttachment,
  AdminTicket,
  AdminTicketPage,
  ReplyTicketRequest,
  UpdateTicketStatusRequest,
  TicketOperationResponse,
  AdminTaskResult,
  AdminGenerationTask,
  AdminTaskAttempt,
  AdminGenerationTaskPage,
  GenerationQueueStats,
  AdminDashboardKpi,
  AdminDashboardSummary,
  AdminDashboardMetric,
  AdminDashboardTrendPoint,
  AdminDashboardTrend,
  AdminModelUsage,
  AdminGallerySubmission,
  AdminGallerySubmissionQuery,
  ApproveGallerySubmissionRequest,
  GalleryReviewReasonRequest,
  BatchApproveGalleryRequest,
  BatchApproveGalleryResult,
  GalleryReviewStats,
  GenerationModelAdapter,
  GenerationModelType,
  GenerationModelCatalogItem,
  GenerationProviderConnection,
  DiscoveredProviderModel,
  SaveProviderConnectionRequest,
  DiscoverProviderModelsRequest,
  AdminGenerationModel,
  ImageQualityPrice,
  VideoResolutionPrice,
  SaveModelRequest,
};
