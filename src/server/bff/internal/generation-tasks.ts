import {
  adjustProfileCredits,
  ensureTaskOutputs,
  getStore,
  nextId,
  resolvePendingGenerations,
} from "@/server/bff/mock-store";
import { estimateGenerationCredits } from "@/utils/generation-credits";

function findThumbnail(thumbnailId: string | null) {
  if (!thumbnailId) {
    return null;
  }

  const store = getStore();
  const asset = store.mediaAssets.find((item) => item.id === thumbnailId);
  if (!asset) {
    return null;
  }

  return asset;
}

function ownsInput(mediaId: string, profileId: string) {
  const store = getStore();
  const asset = store.mediaAssets.find((item) => item.id === mediaId);
  if (!asset) {
    return false;
  }

  if (asset.ownerUserProfileId !== profileId) {
    return false;
  }

  return asset.kind === "input";
}

function outputWithAssets(imageId: string) {
  const store = getStore();
  const image = store.generatedImages.find((item) => item.id === imageId)!;
  const outputAsset = store.mediaAssets.find((asset) => asset.id === image.outputAssetId)!;
  const thumbnailAsset = findThumbnail(image.thumbnailAssetId);

  const gallery = store.galleryImages.find((item) => item.generatedImageId === image.id);
  const galleryImage = gallery || null;

  return {
    ...image,
    outputAsset,
    thumbnailAsset,
    galleryImage,
  };
}

function attachOutputs(taskId: string) {
  const store = getStore();
  const outputs = store.generatedImages.filter((item) => item.taskId === taskId);
  return outputs.map((output) => outputWithAssets(output.id));
}

export async function list(profileId: string, conversationId: string) {
  resolvePendingGenerations();
  const store = getStore();
  return store.generationTasks
    .filter((task) => task.userProfileId === profileId && task.conversationId === conversationId)
    .sort((a, b) => {
      const timeA = a.createdAt.getTime();
      const timeB = b.createdAt.getTime();
      return timeB - timeA;
    })
    .map((task) => ({
      ...task,
      outputs: attachOutputs(task.id),
    }));
}

export async function listHistory(
  profileId: string,
  input: { from?: Date; sort?: "asc" | "desc" } = {},
) {
  resolvePendingGenerations();
  const store = getStore();
  const from = input.from;
  const direction = input.sort ?? "desc";
  const isAscending = direction === "asc";
  const tasks = store.generationTasks
    .filter((task) => task.userProfileId === profileId)
    .filter((task) => {
      if (!from) {
        return true;
      }

      return task.createdAt >= from;
    });

  tasks.sort((a, b) => {
    const timeA = a.createdAt.getTime();
    const timeB = b.createdAt.getTime();

    if (isAscending) {
      return timeA - timeB;
    }

    return timeB - timeA;
  });

  return tasks.map((task) => ({
    ...task,
    outputs: attachOutputs(task.id),
  }));
}

export async function getForUser(profileId: string, taskId: string) {
  resolvePendingGenerations();
  const task = getStore().generationTasks.find(
    (item) => item.id === taskId && item.userProfileId === profileId,
  );
  if (!task) return null;
  if (task.status === "succeeded") {
    ensureTaskOutputs(task.id);
  }
  return {
    ...task,
    outputs: attachOutputs(task.id),
  };
}

export async function create(input: {
  userProfileId: string;
  conversationId: string;
  prompt: string;
  mode: "text" | "edit";
  quality: "low" | "medium" | "high";
  outputFormat: "png" | "webp" | "jpeg";
  size: string;
  imageCount: number;
  inputMediaIds: string[];
}) {
  const store = getStore();
  const profile = store.profiles.find((item) => item.id === input.userProfileId);
  if (!profile) {
    throw new Error("用户不存在");
  }
  const conversation = store.generationConversations.find(
    (item) => item.id === input.conversationId && item.userProfileId === input.userProfileId,
  );
  if (!conversation) {
    throw new Error("对话不存在");
  }
  if (input.mode === "edit" && input.inputMediaIds.length === 0) {
    throw new Error("图生图需要参考图");
  }
  const ownsAllInputs = input.inputMediaIds.every((id) => ownsInput(id, input.userProfileId));
  if (!ownsAllInputs) {
    throw new Error("参考图不存在");
  }

  const costCredits = estimateGenerationCredits({
    mode: input.mode,
    quality: input.quality,
    size: input.size,
    count: input.imageCount,
  });
  if (profile.creditBalance < costCredits) {
    throw new Error("积分不足");
  }

  adjustProfileCredits(input.userProfileId, -costCredits, "创建生成任务", "generation");

  const task = {
    id: nextId("task"),
    userProfileId: input.userProfileId,
    conversationId: input.conversationId,
    prompt: input.prompt.trim(),
    mode: input.mode,
    status: "queued" as const,
    model: store.settings.generation.model,
    size: input.size,
    quality: input.quality,
    outputFormat: input.outputFormat,
    imageCount: input.imageCount,
    costCredits,
    error: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  store.generationTasks.unshift(task);
  conversation.updatedAt = new Date();
  conversation.lastTaskAt = task.createdAt;
  if (conversation.title === "新对话") {
    conversation.title = input.prompt.trim().slice(0, 24) || "新对话";
  }

  return task;
}
