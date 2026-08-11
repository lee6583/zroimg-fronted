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
  ratio?: string;
  resolution?: string;
  quality: GenerationQuality;
  outputFormat: GenerationOutputFormat;
  imageCount: number;
  costCredits: number;
  unitCostCredits?: number;
  createdAt: Date;
  updatedAt: Date;
  outputs: GenerationOutput[];
  error: string | null;
};

type GenerationModelParams = {
  ratios: string[];
  qualities: GenerationQualityOption[];
  counts: number[];
  defaults: {
    ratio: string;
    quality: GenerationQualityOption;
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
  quality: GenerationQualityOption;
  count: number;
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

type GenerationTaskOutputApiItem = {
  id: string;
  imageUrl: string;
  downloadUrl: string;
  fileName: string | null;
  width: number | null;
  height: number | null;
};

type GenerationTaskApiItem = {
  id: string;
  prompt: string;
  mode: GenerationMode;
  status: GenerationTaskStatus;
  size: string;
  ratio: string;
  quality: GenerationQualityOption;
  imageCount: number;
  costCredits: number;
  unitCostCredits: number;
  createdAt: string;
  outputs: GenerationTaskOutputApiItem[];
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
  referenceMediaId?: string;
  quality: GenerationQualityOption;
  ratio: string;
  count: number;
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
  GenerationTaskOutputApiItem,
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
