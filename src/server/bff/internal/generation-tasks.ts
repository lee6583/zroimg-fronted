import { adjustProfileCredits, ensureTaskOutputs, getStore, nextId, resolvePendingGenerations } from "@/server/bff/mock-store";

function parsePixels(size: string) {
  const [width, height] = size.split("x").map(Number);
  const safeWidth = Number.isFinite(width) ? width : 1024;
  const safeHeight = Number.isFinite(height) ? height : 1024;
  return { width: safeWidth, height: safeHeight, pixels: safeWidth * safeHeight };
}

function calculateCost(input: {
  mode: "text" | "edit";
  quality: "low" | "medium" | "high";
  size: string;
  imageCount: number;
}) {
  const { pixels } = parsePixels(input.size);
  const modeBase = input.mode === "edit" ? 15 : 10;
  const qualityMultiplier = input.quality === "high" ? 2 : input.quality === "medium" ? 1.5 : 1;
  const sizeMultiplier = pixels <= 1_100_000 ? 1 : pixels <= 1_600_000 ? 1.5 : pixels <= 3_000_000 ? 2 : 3;
  return Math.ceil(modeBase * qualityMultiplier * sizeMultiplier * input.imageCount);
}

function outputWithAssets(generatedImageId: string) {
  const store = getStore();
  const generatedImage = store.generatedImages.find((item) => item.id === generatedImageId)!;
  const outputAsset = store.mediaAssets.find((asset) => asset.id === generatedImage.outputAssetId)!;
  const thumbnailAsset = generatedImage.thumbnailAssetId
    ? store.mediaAssets.find((asset) => asset.id === generatedImage.thumbnailAssetId) || null
    : null;
  const galleryImage = store.galleryImages.find((item) => item.generatedImageId === generatedImage.id) || null;

  return {
    ...generatedImage,
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

export async function listGenerationTasks(userProfileId: string, conversationId: string) {
  resolvePendingGenerations();
  const store = getStore();
  return store.generationTasks
    .filter((task) => task.userProfileId === userProfileId && task.conversationId === conversationId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((task) => ({
      ...task,
      outputs: attachOutputs(task.id),
    }));
}

export async function listHistoryGenerationTasks(
  userProfileId: string,
  input: { from?: Date; sort?: "asc" | "desc" } = {},
) {
  resolvePendingGenerations();
  const store = getStore();
  const tasks = store.generationTasks
    .filter((task) => task.userProfileId === userProfileId)
    .filter((task) => (input.from ? task.createdAt >= input.from : true))
    .sort((a, b) =>
      input.sort === "asc"
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime(),
    );

  return tasks.map((task) => ({
    ...task,
    outputs: attachOutputs(task.id),
  }));
}

export async function getGenerationTaskForUser(userProfileId: string, taskId: string) {
  resolvePendingGenerations();
  const task = getStore().generationTasks.find((item) => item.id === taskId && item.userProfileId === userProfileId);
  if (!task) return null;
  if (task.status === "succeeded") {
    ensureTaskOutputs(task.id);
  }
  return {
    ...task,
    outputs: attachOutputs(task.id),
  };
}

export async function createGenerationTask(input: {
  userProfileId: string;
  conversationId: string;
  prompt: string;
  mode: "text" | "edit";
  quality: "low" | "medium" | "high";
  outputFormat: "png" | "webp" | "jpeg";
  size: string;
  imageCount: number;
}) {
  const store = getStore();
  const profile = store.profiles.find((item) => item.id === input.userProfileId);
  if (!profile) {
    throw new Error("用户不存在");
  }

  const costCredits = calculateCost(input);
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
  const conversation = store.generationConversations.find((item) => item.id === input.conversationId);
  if (conversation) {
    conversation.updatedAt = new Date();
    conversation.lastTaskAt = task.createdAt;
    if (conversation.title === "新对话") {
      conversation.title = input.prompt.trim().slice(0, 24) || "新对话";
    }
  }

  return task;
}
