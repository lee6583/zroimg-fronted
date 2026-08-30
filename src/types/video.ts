type VideoModeOption = {
  value: string;
  label: string;
};

type VideoModelDefaults = {
  mode: string | null;
  ratio: string | null;
  resolution: string | null;
  duration: number | null;
};

type VideoModelParams = {
  ratios: string[];
  resolutions: string[];
  resolutionsByMode: Record<string, string[]>;
  durations: number[];
  durationMin: number;
  durationMax: number;
  defaults: VideoModelDefaults;
};

type VideoModel = {
  value: string;
  label: string;
  modes: VideoModeOption[];
  params: VideoModelParams;
};

type VideoPrice = {
  priceVersion: string;
  unitPoints: number;
  billingUnit: "second" | "legacy_5_seconds";
  referencePoints: number;
  durationSeconds: number;
  requiredPoints: number;
  currentPoints: number;
  shortagePoints: number;
  enough: boolean;
  detail: string;
};

type VideoResult = {
  id: string;
  mediaAssetId: string | null;
  resultType: string;
  resultUrl: string;
};

type VideoTask = {
  taskNo: string;
  prompt: string;
  mode: string;
  status: string;
  durationSeconds: number;
  ratio: string;
  resolution: string;
  unitPoints: number;
  billingUnit: string;
  referencePoints: number;
  requiredPoints: number;
  failReason: string | null;
  results: VideoResult[];
  createTime: string;
};

type VideoTaskPage = {
  total: number;
  pages: number;
  list: VideoTask[];
};

type VideoModelResponse = {
  models: VideoModel[];
};

type VideoPriceRequest = {
  model: string;
  mode: "text_to_video" | "image_to_video";
  ratio: string;
  resolution: string;
  duration: number;
};

type VideoPriceResponse = {
  price: VideoPrice;
};

type CreateVideoTaskRequest = VideoPriceRequest & {
  prompt: string;
  priceVersion: string;
  referenceMediaId?: string;
};

type CreateVideoTaskResponse = {
  task: VideoTask;
};

type VideoTaskResponse = {
  task: VideoTask;
};

type VideoTaskPageResponse = {
  page: VideoTaskPage;
};

type VideoTaskPageQuery = {
  pageNo: number;
  pageSize: number;
};

export type {
  VideoModeOption,
  VideoModelDefaults,
  VideoModelParams,
  VideoModel,
  VideoPrice,
  VideoResult,
  VideoTask,
  VideoTaskPage,
  VideoModelResponse,
  VideoPriceRequest,
  VideoPriceResponse,
  CreateVideoTaskRequest,
  CreateVideoTaskResponse,
  VideoTaskResponse,
  VideoTaskPageResponse,
  VideoTaskPageQuery,
};
