import type { PageResult } from "@/types/api";

type VideoGenerationMode = "text_to_video" | "image_to_video";

type VideoTaskStatus = "pending" | "processing" | "succeeded" | "failed";

type VideoModelDefaults = {
  mode: string | null;
  ratio: string | null;
  quality: string | null;
  count: number | null;
  resolution: string | null;
  duration: number | null;
};

type VideoBillingUnit = "second" | "request";

type VideoModelSupportParams = {
  ratios: string[];
  qualities: string[];
  counts: number[];
  resolutions: string[];
  durations: number[];
  resolutionsByMode: Record<string, string[]>;
  durationMin: number;
  durationMax: number;
  /** 图生视频最多参考图数量，没有图生视频时为 0 */
  maxReferenceImages?: number;
  minReferenceImages?: number;
  billingUnit?: VideoBillingUnit;
  defaults: VideoModelDefaults;
};

type VideoModel = {
  modelCode: string;
  modelName: string;
  provider: string;
  modelType: string;
  supportModes: string[];
  supportParams: VideoModelSupportParams;
  priceVersion: string | null;
  defaultFlag: number | null;
  sortOrder: number | null;
  remark: string | null;
};

type VideoPriceEstimate = {
  modelCode: string;
  priceVersion: string;
  unitPoints: number;
  billingUnit: string;
  referencePoints: number | null;
  referenceCount?: number | null;
  unitReferencePoints?: number | null;
  durationSeconds: number | null;
  count: number | null;
  requiredPoints: number;
  currentPoints: number;
  shortagePoints: number;
  enough: boolean;
  detail: string;
};

type VideoResult = {
  id: string;
  resultType: string;
  mediaAssetId: string | null;
  resultUrl: string;
  sortOrder: number | null;
};

type VideoTask = {
  id: string;
  taskNo: string;
  modelCode: string;
  modelName: string | null;
  provider: string | null;
  modelType: string;
  mode: string;
  prompt: string;
  referenceImageUrl: string | null;
  referenceMediaId: string | null;
  referenceImages?: VideoReferenceImage[];
  ratio: string;
  resolution: string;
  durationSeconds: number | null;
  priceVersion: string;
  unitPoints: number;
  billingUnit: string | null;
  referencePoints: number | null;
  requiredPoints: number;
  status: VideoTaskStatus;
  failReason: string | null;
  results: VideoResult[];
  createTime: string;
  updateTime: string | null;
  finishTime: string | null;
  attemptCount?: number;
  maxAttempts?: number;
  retrying?: boolean;
  nextAttemptTime?: string | null;
  /** 上游排队 / 生成阶段，例如 carpool_queued；只在进行中有值 */
  progressStage?: string | null;
  progressAhead?: number | null;
  progressPercent?: number | null;
};

type VideoReferenceImage = {
  mediaId: string;
  url: string;
};

type VideoTaskPage = PageResult<VideoTask>;

type VideoPriceEstimateRequest = {
  model: string;
  mode: VideoGenerationMode;
  ratio: string;
  resolution: string;
  duration: number;
  priceVersion?: string;
  referenceCount?: number;
};

type CreateVideoTaskRequest = {
  model: string;
  mode: VideoGenerationMode;
  prompt: string;
  ratio: string;
  resolution: string;
  duration: number;
  priceVersion: string;
  referenceMediaId?: string;
  referenceMediaIds?: string[];
};

type VideoTaskPageQuery = {
  pageNo: number;
  pageSize: number;
  isAsc?: boolean;
  sortBy?: string;
  status?: VideoTaskStatus;
  mode?: VideoGenerationMode;
};

export type {
  VideoBillingUnit,
  VideoReferenceImage,
  VideoGenerationMode,
  VideoTaskStatus,
  VideoModelDefaults,
  VideoModelSupportParams,
  VideoModel,
  VideoPriceEstimate,
  VideoResult,
  VideoTask,
  VideoTaskPage,
  VideoPriceEstimateRequest,
  CreateVideoTaskRequest,
  VideoTaskPageQuery,
};
