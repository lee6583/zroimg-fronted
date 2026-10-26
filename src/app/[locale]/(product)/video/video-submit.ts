import { videoApi } from "@/api/video";
import type { CreateVideoTaskRequest, VideoGenerationMode, VideoTask } from "@/types/video";

export type VideoTaskInput = Omit<CreateVideoTaskRequest, "priceVersion">;

/** 积分不足：页面用 video.errors.insufficientPoints 展示。 */
export class VideoPointsShortageError extends Error {
  readonly shortagePoints: number;

  constructor(shortagePoints: number) {
    super("insufficient points");
    this.name = "VideoPointsShortageError";
    this.shortagePoints = shortagePoints;
  }
}

export function isVideoMode(mode: string): mode is VideoGenerationMode {
  return mode === "text_to_video" || mode === "image_to_video";
}

// 先按当前价格估算积分，不足时抛出 VideoPointsShortageError，再创建任务
export async function submitVideoTask(input: VideoTaskInput) {
  const price = await videoApi.estimate({
    model: input.model,
    mode: input.mode,
    ratio: input.ratio,
    resolution: input.resolution,
    duration: input.duration,
  });

  if (!price.enough) {
    throw new VideoPointsShortageError(price.shortagePoints);
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
