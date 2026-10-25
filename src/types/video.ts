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

type VideoModelSupportParams = {
  ratios: string[];
  qualities: string[];
  counts: number[];
  resolutions: string[];
  durations: number[];
  resolutionsByMode: Record<string, string[]>;
  durationMin: number;
  durationMax: number;
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
};

type VideoTaskPage = PageResult<VideoTask>;

type VideoPriceEstimateRequest = {
  model: string;
  mode: VideoGenerationMode;
  ratio: string;
  resolution: string;
  duration: number;
  priceVersion?: string;
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
