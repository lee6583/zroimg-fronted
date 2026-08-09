type GenerationMode = "text" | "edit";

type GenerationQuality = string;

type GenerationOutputFormat = string;

type GenerationQualityOption = GenerationQuality | "auto";

type GenerationTaskStatus = "queued" | "running" | "succeeded" | "failed";

type GenerationAsset = {
  id: string;
  fileName: string | null;
  width: number | null;
  height: number | null;
};

type GenerationOutput = {
  id: string;
  width: number | null;
  height: number | null;
  outputAsset: GenerationAsset;
  thumbnailAsset: GenerationAsset | null;
  galleryImage: unknown | null;
};

type GenerationTaskView = {
  id: string;
  prompt: string;
  mode: GenerationMode;
  status: GenerationTaskStatus;
  model: string;
  size: string;
  quality: GenerationQuality;
  outputFormat: GenerationOutputFormat;
  imageCount: number;
  costCredits: number;
  createdAt: Date;
  updatedAt: Date;
  imageUrls?: string[];
  outputs: GenerationOutput[];
  error: string | null;
};

type GenerationModelParams = {
  ratios: string[];
  resolutions: string[];
  qualities: GenerationQualityOption[];
  formats: GenerationOutputFormat[];
  counts: number[];
  defaults: {
    ratio: string;
    resolution: string;
    quality: GenerationQualityOption;
    format: GenerationOutputFormat;
    count: number;
  };
};

type GenerationModelOption = {
  value: string;
  label: string;
  modes: GenerationMode[];
  defaultMode: GenerationMode;
  params: Partial<Record<GenerationMode, GenerationModelParams>>;
};

type GenerationPriceRequest = {
  model: string;
  mode: GenerationMode;
  ratio: string;
  resolution: string;
  quality: GenerationQualityOption;
  outputFormat: GenerationOutputFormat;
  imageCount: number;
  size: string;
};

type GenerationPriceResponse = {
  priceVersion: string;
  unitPoints: number;
  imageCount: number;
  requiredPoints: number;
  currentPoints: number;
  shortagePoints: number;
  enough: boolean;
  detail: string;
};

type UploadedMediaApiItem = {
  id: string;
  fileName: string | null;
  kind: "input" | "output";
};

type GenerationTaskApiItem = {
  id: string;
  prompt: string;
  mode: GenerationMode;
  status: GenerationTaskStatus;
  size: string;
  imageCount: number;
  costCredits: number;
  createdAt: string;
  imageUrls?: string[];
};

type GenerationConversationTaskSummary = {
  status: GenerationTaskStatus;
  costCredits: number;
};

type GenerationConversationApiItem = {
  id: string;
  title: string;
  lastTaskAt: string | null;
  updatedAt: string;
  createdAt: string;
  _count: { tasks: number };
  tasks: GenerationConversationTaskSummary[];
};

type FetchGenerationConversationsResponse = {
  conversations: GenerationConversationApiItem[];
};

type CreateGenerationConversationRequest = {
  title?: string;
};

type CreateGenerationConversationResponse = {
  conversation: GenerationConversationApiItem;
};

type FetchConversationTasksResponse = {
  tasks: GenerationTaskApiItem[];
};

type UpdateGenerationConversationRequest = {
  title: string;
};

type UpdateGenerationConversationResponse = {
  conversation: GenerationConversationApiItem;
};

type DeleteGenerationConversationResponse = {
  ok: true;
};

type UploadMediaResponse = {
  media: UploadedMediaApiItem;
};

type CreateGenerationTaskRequest = {
  conversationId: string;
  model: string;
  prompt: string;
  mode: GenerationMode;
  quality: GenerationQualityOption;
  outputFormat: GenerationOutputFormat;
  ratio: string;
  resolution: string;
  size: string;
  imageCount: number;
  inputMediaIds: string[];
};

type CreateGenerationTaskResponse = {
  task: GenerationTaskApiItem;
};

type FetchGenerationTaskResponse = {
  task: GenerationTaskApiItem;
};

type CreateFavoriteCollectionRequest = {
  name: string;
};

type FavoriteCollectionMutationResponse = {
  collection: unknown;
};

type UpdateFavoriteCollectionRequest = {
  name: string;
};

type DeleteFavoriteCollectionResponse = {
  ok?: boolean;
};

type AddImageToFavoriteCollectionRequest = {
  generatedImageId: string;
};

type AddImageToFavoriteCollectionResponse = {
  ok?: boolean;
};

type PublishGalleryImageRequest = {
  generatedImageId: string;
};

type PublishGalleryImageResponse = {
  ok?: boolean;
};

export type {
  GenerationMode,
  GenerationQuality,
  GenerationQualityOption,
  GenerationOutputFormat,
  GenerationTaskStatus,
  GenerationAsset,
  GenerationOutput,
  GenerationTaskView,
  GenerationModelParams,
  GenerationModelOption,
  GenerationPriceRequest,
  GenerationPriceResponse,
  UploadedMediaApiItem,
  GenerationTaskApiItem,
  GenerationConversationTaskSummary,
  GenerationConversationApiItem,
  FetchGenerationConversationsResponse,
  CreateGenerationConversationRequest,
  CreateGenerationConversationResponse,
  FetchConversationTasksResponse,
  UpdateGenerationConversationRequest,
  UpdateGenerationConversationResponse,
  DeleteGenerationConversationResponse,
  UploadMediaResponse,
  CreateGenerationTaskRequest,
  CreateGenerationTaskResponse,
  FetchGenerationTaskResponse,
  CreateFavoriteCollectionRequest,
  FavoriteCollectionMutationResponse,
  UpdateFavoriteCollectionRequest,
  DeleteFavoriteCollectionResponse,
  AddImageToFavoriteCollectionRequest,
  AddImageToFavoriteCollectionResponse,
  PublishGalleryImageRequest,
  PublishGalleryImageResponse,
};
