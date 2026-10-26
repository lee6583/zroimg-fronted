import type { GalleryStatus } from "@/types/gallery";

type GenerationMode = "text_to_image" | "image_to_image" | "inpaint";

type GenerationTaskStatus = "pending" | "processing" | "succeeded" | "failed";

type GenerationModelParams = {
  ratios: string[];
  qualities: string[];
  counts: number[];
  defaults: {
    mode: string | null;
    ratio: string | null;
    quality: string | null;
    count: number | null;
  };
};

type GenerationModel = {
  modelCode: string;
  modelName: string;
  provider: string;
  modelType: string;
  supportModes: string[];
  supportParams: GenerationModelParams;
  priceVersion: string;
  defaultFlag: number;
  sortOrder: number;
  remark: string | null;
};

type GenerationPriceEstimateRequest = {
  modelCode: string;
  mode: string;
  ratio: string;
  quality: string;
  count: number;
};

type GenerationPriceEstimate = {
  modelCode: string;
  priceVersion: string;
  unitPoints: number;
  billingUnit: string | null;
  referencePoints: number | null;
  durationSeconds: number | null;
  count: number;
  requiredPoints: number;
  currentPoints: number;
  shortagePoints: number;
  enough: boolean;
  detail: string | null;
};

type GenerationResult = {
  id: string;
  resultType: string;
  mediaAssetId: string;
  resultUrl: string;
  sortOrder: number;
  galleryStatus: GalleryStatus | null;
  galleryRejectReason: string | null;
};

type GenerationTask = {
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
  maskMediaId: string | null;
  canvasId: string | null;
  ratio: string | null;
  resolution: string | null;
  quality: string | null;
  format: string | null;
  count: number;
  durationSeconds: number | null;
  audio: boolean | null;
  priceVersion: string | null;
  unitPoints: number | null;
  billingUnit: string | null;
  referencePoints: number | null;
  requiredPoints: number;
  status: GenerationTaskStatus;
  failReason: string | null;
  results: GenerationResult[] | null;
  createTime: string;
  updateTime: string | null;
  finishTime: string | null;
  attemptCount?: number;
  maxAttempts?: number;
  retrying?: boolean;
  nextAttemptTime?: string | null;
};

// 自动重试进度；后端未返回时按未重试处理
type GenerationTaskRetry = {
  attemptCount?: number;
  maxAttempts?: number;
  retrying?: boolean;
  nextAttemptTime?: string | null;
};

type GenerationTaskQuery = {
  pageNo?: number;
  pageSize?: number;
  sortBy?: string;
  isAsc?: boolean;
  status?: GenerationTaskStatus;
  mode?: string;
  modelType?: string;
  beginTime?: string;
  endTime?: string;
};

type CreateGenerationTaskRequest = {
  modelCode: string;
  conversationId?: string;
  canvasId?: string;
  mode: string;
  prompt: string;
  referenceMediaId?: string;
  maskMediaId?: string;
  ratio: string;
  quality: string;
  count: number;
};

type GenerationConversationTaskSummary = {
  status: GenerationTaskStatus;
  costCredits: number;
};

type GenerationConversation = {
  id: string;
  title: string;
  lastTaskAt: string | null;
  updatedAt: string;
  createdAt: string;
  count: { tasks: number };
  tasks: GenerationConversationTaskSummary[];
};

type GenerationConversationRequest = {
  title: string;
};

type MediaAsset = {
  id: string;
  originalName: string | null;
  mediaType: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  status: string;
  contentUrl: string;
  createdAt: string;
};

type MediaUploadPresignRequest = {
  originalName: string;
  contentType: string;
  size: number;
};

type MediaUploadPresign = {
  assetId: string;
  uploadUrl: string;
  requiredHeaders: Record<string, string>;
  expiresAt: string;
  originalName: string;
};

type GenerationUserLimits = {
  maxActiveImageTasks: number;
  maxActiveVideoTasks: number;
  activeImageTasks: number;
  activeVideoTasks: number;
};

export type {
  GenerationMode,
  GenerationTaskStatus,
  GenerationModelParams,
  GenerationModel,
  GenerationPriceEstimateRequest,
  GenerationPriceEstimate,
  GenerationResult,
  GenerationTask,
  GenerationTaskRetry,
  GenerationTaskQuery,
  CreateGenerationTaskRequest,
  GenerationConversationTaskSummary,
  GenerationConversation,
  GenerationConversationRequest,
  MediaAsset,
  MediaUploadPresignRequest,
  MediaUploadPresign,
  GenerationUserLimits,
};
