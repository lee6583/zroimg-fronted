import { videoApi } from "@/api/video";
import type { CreateVideoTaskRequest, VideoGenerationMode, VideoTask } from "@/types/video";

export type VideoTaskInput = Omit<CreateVideoTaskRequest, "priceVersion">;

export function isVideoMode(mode: string): mode is VideoGenerationMode {
  return mode === "text_to_video" || mode === "image_to_video";
}

export function displayMode(mode: string) {
  if (mode === "text_to_video") {
    return "文生视频";
  }
  if (mode === "image_to_video") {
    return "图生视频";
  }
  return mode;
}

// 先按当前价格估算积分，不足时抛出可读错误，再创建任务
export async function submitVideoTask(input: VideoTaskInput) {
  const price = await videoApi.estimate({
    model: input.model,
    mode: input.mode,
    ratio: input.ratio,
    resolution: input.resolution,
    duration: input.duration,
  });

  if (!price.enough) {
    throw new Error(`积分不足，还需要 ${price.shortagePoints} 积分`);
  }

  return videoApi.createTask({ ...input, priceVersion: price.priceVersion });
}

export function retryInput(task: VideoTask): VideoTaskInput | null {
  if (!isVideoMode(task.mode) || task.durationSeconds === null) {
    return null;
  }

  let referenceMediaId: string | null = null;
  if (task.mode === "image_to_video") {
    referenceMediaId = task.referenceMediaId;
  }

  return {
    model: task.modelCode,
    mode: task.mode,
    prompt: task.prompt,
    ratio: task.ratio,
    resolution: task.resolution,
    duration: task.durationSeconds,
    referenceMediaId: referenceMediaId ?? undefined,
  };
}
