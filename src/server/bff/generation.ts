import { isJavaBffEnabled } from "@/server/env";
import * as mockConversation from "@/server/bff/internal/generation-conversations";
import * as mockTask from "@/server/bff/internal/generation-tasks";
import * as mockGallery from "@/server/bff/internal/gallery";
import * as javaGallery from "@/server/bff/internal/java-gallery";
import * as mockStorage from "@/server/bff/internal/storage";
import * as javaGeneration from "@/server/bff/internal/java-generation";
import type { GalleryCategory } from "@/server/bff/internal/gallery";
import type {
  GenerationModelOption,
  GenerationModelParams,
  GenerationPriceRequest,
} from "@/types/generation";

export type { GalleryCategory } from "@/server/bff/internal/gallery";

export async function listModels(): Promise<GenerationModelOption[]> {
  if (isJavaBffEnabled()) {
    return javaGeneration.listModels();
  }

  const params: GenerationModelParams = {
    ratios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
    qualities: ["low", "medium", "high"],
    counts: [1, 2, 4],
    defaults: {
      ratio: "1:1",
      quality: "medium" as const,
      count: 1,
    },
  };

  return [
    {
      value: "gpt-image-2",
      label: "GPT Image 2",
      modes: ["text", "edit"],
      defaultMode: "text",
      params: { text: params, edit: params },
    },
  ];
}

export async function ensureDefaultConversation(profileId: string) {
  if (isJavaBffEnabled()) {
    return javaGeneration.ensureDefault();
  }

  return mockConversation.ensureDefault(profileId);
}

export async function listConversations(profileId: string) {
  if (isJavaBffEnabled()) {
    return javaGeneration.listConversations();
  }

  return mockConversation.list(profileId);
}

export async function createConversation(profileId: string, title: string) {
  if (isJavaBffEnabled()) {
    return javaGeneration.createConversation(title);
  }

  return mockConversation.create(profileId, title);
}

export async function updateTitle(profileId: string, conversationId: string, title: string) {
  if (isJavaBffEnabled()) {
    return javaGeneration.updateTitle(conversationId, title);
  }

  return mockConversation.updateTitle(profileId, conversationId, title);
}

export async function deleteConversation(profileId: string, conversationId: string) {
  if (isJavaBffEnabled()) {
    return javaGeneration.remove(conversationId);
  }

  return mockConversation.remove(profileId, conversationId);
}

export async function requireConversation(profileId: string, conversationId: string) {
  if (isJavaBffEnabled()) {
    return javaGeneration.requireOwned(conversationId);
  }

  return mockConversation.requireOwned(profileId, conversationId);
}

export async function listTasks(profileId: string, conversationId: string) {
  if (isJavaBffEnabled()) {
    return javaGeneration.listTasks(conversationId);
  }

  return mockTask.list(profileId, conversationId);
}

type HistoryQuery = {
  page?: number;
  pageSize?: number;
  from?: Date;
  to?: Date;
  sort?: "asc" | "desc";
  modelType?: "image" | "video";
};

export async function pageHistoryTasks(profileId: string, input: HistoryQuery = {}) {
  if (isJavaBffEnabled()) {
    return javaGeneration.listHistory(input);
  }

  const page = input.page || 1;
  const pageSize = input.pageSize || 20;
  if (input.modelType === "video") {
    return { total: 0, pages: 0, list: [] };
  }

  const tasks = await mockTask.listHistory(profileId, input);
  const start = (page - 1) * pageSize;
  const list = tasks.slice(start, start + pageSize);

  return {
    total: tasks.length,
    pages: Math.ceil(tasks.length / pageSize),
    list,
  };
}

export async function listHistoryTasks(profileId: string, input: HistoryQuery = {}) {
  const page = await pageHistoryTasks(profileId, input);
  return page.list;
}

export async function estimatePrice(profileId: string, input: GenerationPriceRequest) {
  if (isJavaBffEnabled()) {
    return javaGeneration.estimatePrice(input);
  }

  return mockTask.estimatePrice(profileId, input);
}

export async function getTask(profileId: string, taskId: string) {
  if (isJavaBffEnabled()) {
    return javaGeneration.getTask(taskId);
  }

  return mockTask.getForUser(profileId, taskId);
}

export async function createTask(input: {
  userProfileId: string;
  conversationId: string;
  model: string;
  prompt: string;
  mode: "text" | "edit";
  referenceMediaId?: string;
  quality: string;
  ratio: string;
  count: number;
}) {
  if (isJavaBffEnabled()) {
    return javaGeneration.createTask(input);
  }

  return mockTask.create(input);
}

export async function getMediaSignedUrl(assetId: string, isPublic = false) {
  if (isJavaBffEnabled()) {
    return javaGeneration.getMediaSignedUrl(assetId, isPublic);
  }

  return mockStorage.getMediaSignedUrl(assetId);
}

export const uploadMedia = mockStorage.uploadMedia;

type GalleryQuery = {
  category?: GalleryCategory;
  page?: number;
  pageSize?: number;
};

export async function listPublicImages(input: GalleryQuery = {}) {
  if (isJavaBffEnabled()) {
    return javaGallery.listPublicImages(input);
  }

  const page = input.page || 1;
  const pageSize = input.pageSize || 20;
  const images = await mockGallery.listPublicImages(input.category);
  const start = (page - 1) * pageSize;

  return {
    total: images.length,
    pages: Math.ceil(images.length / pageSize),
    list: images.slice(start, start + pageSize),
  };
}

export const normalizeCategory = mockGallery.normalizeCategory;

export async function publishImage(generatedImageId: string, profileId: string) {
  if (isJavaBffEnabled()) {
    return javaGallery.publishImage(generatedImageId);
  }

  return mockGallery.publishImage(generatedImageId, profileId);
}

export async function unpublishImage(generatedImageId: string, profileId: string) {
  if (isJavaBffEnabled()) {
    return javaGallery.unpublishImage(generatedImageId);
  }

  return mockGallery.unpublishImage(generatedImageId, profileId);
}
