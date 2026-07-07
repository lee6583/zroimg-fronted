export type GenerationMode = "text" | "edit";

export type GenerationTaskStatus = "queued" | "running" | "succeeded" | "failed";

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

