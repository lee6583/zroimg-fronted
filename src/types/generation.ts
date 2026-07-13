type GenerationMode = "text" | "edit";

type GenerationQuality = "low" | "medium" | "high";

type GenerationOutputFormat = "png" | "webp" | "jpeg";

type GenerationTaskStatus = "queued" | "running" | "succeeded" | "failed";

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
  prompt: string;
  mode: GenerationMode;
  quality: GenerationQuality;
  outputFormat: GenerationOutputFormat;
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
  GenerationOutputFormat,
  GenerationTaskStatus,
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
