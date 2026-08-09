type VideoModeOption = {
  value: string;
  label: string;
};

type VideoModelDefaults = {
  mode: string | null;
  ratio: string | null;
  resolution: string | null;
  quality: string | null;
  duration: number | null;
  audio: boolean | null;
};

type VideoModelParams = {
  ratios: string[];
  resolutions: string[];
  qualities: string[];
  durations: number[];
  audios: boolean[];
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
  requiredPoints: number;
  currentPoints: number;
  shortagePoints: number;
  enough: boolean;
  detail: string;
};

type VideoResult = {
  id: number;
  mediaAssetId: number | null;
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
  quality: string;
  audio: boolean;
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
  modelCode: string;
  mode: "text_to_video" | "image_to_video";
  ratio: string;
  resolution: string;
  quality: string;
  durationSeconds: number;
  audio: boolean;
};

type VideoPriceResponse = {
  price: VideoPrice;
};

type CreateVideoTaskRequest = VideoPriceRequest & {
  prompt: string;
  priceVersion: string;
  referenceMediaId?: string | number;
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
