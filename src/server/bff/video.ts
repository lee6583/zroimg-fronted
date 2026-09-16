import "server-only";

import { isJavaBffEnabled } from "@/server/env";
import * as javaVideo from "@/server/bff/internal/java-video";
import type {
  CreateVideoTaskRequest,
  VideoModel,
  VideoPrice,
  VideoPriceRequest,
  VideoTask,
  VideoTaskPage,
  VideoTaskPageQuery,
} from "@/types/video";

export async function listVideoModels(): Promise<VideoModel[]> {
  if (!isJavaBffEnabled()) {
    return [];
  }
  return javaVideo.listVideoModels();
}

export async function estimateVideoPrice(input: VideoPriceRequest): Promise<VideoPrice> {
  if (!isJavaBffEnabled()) {
    throw new Error("视频接口仅在 Java 模式可用");
  }
  return javaVideo.estimateVideoPrice(input);
}

export async function createVideoTask(input: CreateVideoTaskRequest): Promise<VideoTask> {
  if (!isJavaBffEnabled()) {
    throw new Error("视频接口仅在 Java 模式可用");
  }
  return javaVideo.createVideoTask(input);
}

export async function getVideoTask(taskNo: string): Promise<VideoTask> {
  if (!isJavaBffEnabled()) {
    throw new Error("视频接口仅在 Java 模式可用");
  }
  return javaVideo.getVideoTask(taskNo);
}

export async function listVideoTasks(query: VideoTaskPageQuery): Promise<VideoTaskPage> {
  if (!isJavaBffEnabled()) {
    return { total: 0, pages: 1, list: [] };
  }
  return javaVideo.listVideoTasks(query);
}
