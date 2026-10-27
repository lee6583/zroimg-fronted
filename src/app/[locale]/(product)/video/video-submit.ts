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

export function referenceCount(input: VideoTaskInput) {
  if (input.mode !== "image_to_video") {
    return 0;
  }
  if (input.referenceMediaIds && input.referenceMediaIds.length > 0) {
    return input.referenceMediaIds.length;
  }
  if (input.referenceMediaId) {
    return 1;
  }
  return 0;
}

export function estimateVideoTask(input: VideoTaskInput) {
  return videoApi.estimate({
    model: input.model,
    mode: input.mode,
    ratio: input.ratio,
    resolution: input.resolution,
    duration: input.duration,
    referenceCount:
      input.mode === "image_to_video" ? Math.max(referenceCount(input), 1) : undefined,
  });
}

// 先按当前价格估算积分，不足时抛出 VideoPointsShortageError，再创建任务
export async function submitVideoTask(input: VideoTaskInput) {
  const price = await estimateVideoTask(input);

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
  let referenceMediaIds: string[] | undefined;
  if (task.mode === "image_to_video") {
    referenceMediaId = task.referenceMediaId;
    const images = task.referenceImages ?? [];
    if (images.length > 0) {
      referenceMediaIds = images.map((image) => image.mediaId);
    }
  }

  return {
    model: task.modelCode,
    mode: task.mode,
    prompt: task.prompt,
    ratio: task.ratio,
    resolution: task.resolution,
    duration: task.durationSeconds,
    referenceMediaId: referenceMediaId ?? undefined,
    referenceMediaIds,
  };
}
