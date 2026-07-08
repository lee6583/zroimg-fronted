export type GenerationMode = "text" | "edit";

export type GenerationQuality = "low" | "medium" | "high";

export type GenerationOutputFormat = "png" | "webp" | "jpeg";

export type GenerationTaskStatus =
  "queued" | "running" | "succeeded" | "failed";

export type UploadedMediaApiItem = {
  id: string;
  fileName: string | null;
  kind: "input" | "output";
};

export type GenerationTaskApiItem = {
  id: string;
  prompt: string;
  mode: GenerationMode;
  status: GenerationTaskStatus | string;
  size: string;
  imageCount: number;
  costCredits: number;
  createdAt: string;
  source?: "platform" | "local";
  imageUrls?: string[];
};

export type GenerationConversationTaskSummary = {
  status: string;
  costCredits: number;
};

export type GenerationConversationApiItem = {
  id: string;
  title: string;
  taskCount?: number;
  latestTaskStatus?: string | null;
  latestTaskCost?: number | null;
  lastTaskAt?: string | null;
  updatedAt: string;
  createdAt: string;
  _count?: { tasks: number };
  tasks?: GenerationConversationTaskSummary[];
};

export type FetchGenerationConversationsResponse =
  | { conversations?: GenerationConversationApiItem[] }
  | GenerationConversationApiItem[];

export type CreateGenerationConversationRequest = {
  title?: string;
};

export type CreateGenerationConversationResponse = {
  conversation?: GenerationConversationApiItem;
};

export type FetchConversationTasksResponse =
  { tasks?: GenerationTaskApiItem[] } | GenerationTaskApiItem[];

export type UpdateGenerationConversationRequest = {
  title: string;
};

export type UpdateGenerationConversationResponse = {
  conversation?: GenerationConversationApiItem;
};

export type DeleteGenerationConversationResponse = {
  ok?: boolean;
};

export type UploadMediaResponse = {
  media: UploadedMediaApiItem;
};

export type CreateGenerationTaskRequest = {
  conversationId: string;
  prompt: string;
  mode?: GenerationMode;
  quality?: GenerationQuality;
  outputFormat?: GenerationOutputFormat;
  size?: string;
  imageCount?: number;
  inputMediaIds?: string[];
};

export type CreateGenerationTaskResponse = {
  task: GenerationTaskApiItem;
};

export type FetchGenerationTaskResponse = {
  task: GenerationTaskApiItem;
};

export type CreateFavoriteCollectionRequest = {
  name: string;
};

export type FavoriteCollectionMutationResponse = {
  collection: unknown;
};

export type UpdateFavoriteCollectionRequest = {
  name: string;
};

export type DeleteFavoriteCollectionResponse = {
  ok?: boolean;
};

export type AddImageToFavoriteCollectionRequest = {
  generatedImageId: string;
};

export type AddImageToFavoriteCollectionResponse = {
  ok?: boolean;
};

export type PublishGalleryImageRequest = {
  generatedImageId: string;
};

export type PublishGalleryImageResponse = {
  ok?: boolean;
};
