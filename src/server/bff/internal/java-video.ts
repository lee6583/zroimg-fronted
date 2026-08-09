import "server-only";

import { z } from "zod";
import { requestJavaApiData } from "@/server/java-api";
import type {
  CreateVideoTaskRequest,
  VideoModel,
  VideoPrice,
  VideoPriceRequest,
  VideoResult,
  VideoTask,
  VideoTaskPage,
  VideoTaskPageQuery,
} from "@/types/video";

const modelDefaultsSchema = z.object({
  mode: z.string().nullable(),
  ratio: z.string().nullable(),
  resolution: z.string().nullable(),
  quality: z.string().nullable(),
  duration: z.number().nullable(),
  audio: z.boolean().nullable(),
});

const modelParamsSchema = z.object({
  ratios: z.array(z.string()),
  resolutions: z.array(z.string()),
  qualities: z.array(z.string()),
  formats: z.array(z.string()),
  counts: z.array(z.number()),
  durations: z.array(z.number()),
  audios: z.array(z.boolean()),
  defaults: modelDefaultsSchema,
});

const modelSchema = z.object({
  modelCode: z.string(),
  modelName: z.string(),
  supportModes: z.array(z.string()),
  supportParams: modelParamsSchema,
});

const priceSchema = z.object({
  priceVersion: z.string(),
  requiredPoints: z.number(),
  currentPoints: z.number(),
  shortagePoints: z.number(),
  enough: z.boolean(),
  detail: z.string(),
});

const resultSchema = z.object({
  id: z.number(),
  mediaAssetId: z.number().nullable(),
  resultType: z.string(),
  resultUrl: z.string(),
});

const taskSchema = z.object({
  taskNo: z.string(),
  prompt: z.string(),
  mode: z.string(),
  status: z.string(),
  durationSeconds: z.number(),
  ratio: z.string(),
  resolution: z.string(),
  quality: z.string(),
  audio: z.boolean(),
  requiredPoints: z.number(),
  failReason: z.string().nullable(),
  results: z.array(resultSchema),
  createTime: z.string(),
});

const taskPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(taskSchema),
});

function modeLabel(mode: string) {
  if (mode === "text_to_video") {
    return "文生视频";
  }
  if (mode === "image_to_video") {
    return "图生视频";
  }
  return mode;
}

function mapModel(model: z.infer<typeof modelSchema>): VideoModel {
  const modes = model.supportModes.map((mode) => {
    return {
      value: mode,
      label: modeLabel(mode),
    };
  });

  return {
    value: model.modelCode,
    label: model.modelName,
    modes,
    params: {
      ratios: model.supportParams.ratios,
      resolutions: model.supportParams.resolutions,
      qualities: model.supportParams.qualities,
      durations: model.supportParams.durations,
      audios: model.supportParams.audios,
      defaults: model.supportParams.defaults,
    },
  };
}

function mapResult(result: z.infer<typeof resultSchema>): VideoResult {
  let resultUrl = result.resultUrl;
  if (result.mediaAssetId !== null) {
    resultUrl = `/api/media/assets/${result.mediaAssetId}`;
  }

  return {
    id: result.id,
    mediaAssetId: result.mediaAssetId,
    resultType: result.resultType,
    resultUrl,
  };
}

function mapTask(task: z.infer<typeof taskSchema>): VideoTask {
  const results = task.results.map(mapResult);

  return {
    taskNo: task.taskNo,
    prompt: task.prompt,
    mode: task.mode,
    status: task.status,
    durationSeconds: task.durationSeconds,
    ratio: task.ratio,
    resolution: task.resolution,
    quality: task.quality,
    audio: task.audio,
    requiredPoints: task.requiredPoints,
    failReason: task.failReason,
    results,
    createTime: task.createTime,
  };
}

export async function listVideoModels(): Promise<VideoModel[]> {
  const payload = await requestJavaApiData<unknown>("/generation/user/video/models");
  const models = z.array(modelSchema).parse(payload);
  return models.map(mapModel);
}

export async function estimateVideoPrice(input: VideoPriceRequest): Promise<VideoPrice> {
  const payload = await requestJavaApiData<unknown>("/generation/user/video/price/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return priceSchema.parse(payload);
}

export async function createVideoTask(input: CreateVideoTaskRequest): Promise<VideoTask> {
  const payload = await requestJavaApiData<unknown>("/generation/user/video/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const task = taskSchema.parse(payload);
  return mapTask(task);
}

export async function getVideoTask(taskNo: string): Promise<VideoTask> {
  const safeTaskNo = encodeURIComponent(taskNo);
  const payload = await requestJavaApiData<unknown>(`/generation/user/video/tasks/${safeTaskNo}`);
  const task = taskSchema.parse(payload);
  return mapTask(task);
}

export async function listVideoTasks(query: VideoTaskPageQuery): Promise<VideoTaskPage> {
  const search = new URLSearchParams();
  search.set("pageNo", String(query.pageNo));
  search.set("pageSize", String(query.pageSize));
  search.set("isAsc", "false");
  search.set("sortBy", "create_time");

  const path = `/generation/user/video/tasks?${search.toString()}`;
  const payload = await requestJavaApiData<unknown>(path);
  const page = taskPageSchema.parse(payload);

  return {
    total: page.total,
    pages: page.pages,
    list: page.list.map(mapTask),
  };
}
