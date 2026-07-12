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
  const image = store.generatedImages.find((item) => item.id === imageId);
  if (!image) {
    throw new Error(`没有找到生成图片：${imageId}`);
  }

  const outputAsset = store.mediaAssets.find((asset) => asset.id === image.outputAssetId);
  if (!outputAsset) {
    throw new Error(`没有找到图片资源：${image.outputAssetId}`);
  }

  const thumbnailAsset = findThumbnail(image.thumbnailAssetId);

  const gallery = store.galleryImages.find((item) => item.generatedImageId === image.id);
  const galleryImage = gallery || null;

  const result = {
    ...image,
    outputAsset: outputAsset,
    thumbnailAsset: thumbnailAsset,
    galleryImage: galleryImage,
  };

  return result;
}

function attachOutputs(taskId: string) {
  const store = getStore();

  // 第一步：找出当前任务生成出来的图片。
  const outputs = store.generatedImages.filter((image) => {
    return image.taskId === taskId;
  });

  // 第二步：给每张图片补充资源信息。
  const outputsWithAssets = outputs.map((output) => {
    return outputWithAssets(output.id);
  });

  return outputsWithAssets;
}

export async function list(profileId: string, conversationId: string) {
  resolvePendingGenerations();
  const store = getStore();

  // 第一步：找出当前用户、当前对话里的生成任务。
  const tasks = store.generationTasks.filter((task) => {
    const isOwner = task.userProfileId === profileId;
    const isCurrentConversation = task.conversationId === conversationId;

    return isOwner && isCurrentConversation;
  });

  // 第二步：按照创建时间，从新到旧排序。
  tasks.sort((taskA, taskB) => {
    const timeA = taskA.createdAt.getTime();
    const timeB = taskB.createdAt.getTime();

    return timeB - timeA;
  });

  // 第三步：给每个任务补充输出图片。
  const tasksWithOutputs = tasks.map((task) => {
    const result = {
      ...task,
      outputs: attachOutputs(task.id),
    };

    return result;
  });

  return tasksWithOutputs;
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

  // 第一步：找出当前用户的历史生成任务。
  let tasks = store.generationTasks.filter((task) => {
    return task.userProfileId === profileId;
  });

  // 第二步：如果传入起始时间，只保留起始时间之后的任务。
  if (from) {
    tasks = tasks.filter((task) => {
      return task.createdAt >= from;
    });
  }

  // 第三步：按照创建时间排序。
  tasks.sort((a, b) => {
    const timeA = a.createdAt.getTime();
    const timeB = b.createdAt.getTime();

    if (isAscending) {
      return timeA - timeB;
    }

    return timeB - timeA;
  });

  // 第四步：给每个任务补充输出图片。
  const tasksWithOutputs = tasks.map((task) => {
    const result = {
      ...task,
      outputs: attachOutputs(task.id),
    };

    return result;
  });

  return tasksWithOutputs;
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

  const result = {
    ...task,
    outputs: attachOutputs(task.id),
  };

  return result;
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
