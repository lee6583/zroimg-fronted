import "server-only";

import { z } from "zod";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
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
  quality: z.string().nullable().optional(),
  duration: z.number().nullable(),
  audio: z.boolean().nullable().optional(),
});

const modelParamsSchema = z.object({
  ratios: z.array(z.string()),
  resolutions: z.array(z.string()),
  resolutionsByMode: z.record(z.string(), z.array(z.string())).nullish(),
  qualities: z.array(z.string()).optional(),
  durations: z.array(z.number()),
  durationMin: z.number().nullish(),
  durationMax: z.number().nullish(),
  audios: z.array(z.boolean()).optional(),
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
  unitPoints: z.number(),
  billingUnit: z.literal("second").nullish(),
  referencePoints: z.number().nullish(),
  durationSeconds: z.number().nullish(),
  requiredPoints: z.number(),
  currentPoints: z.number(),
  shortagePoints: z.number(),
  enough: z.boolean(),
  detail: z.string(),
});

const resultSchema = z.object({
  id: javaIdSchema,
  mediaAssetId: javaIdSchema.nullable(),
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
  unitPoints: z.number(),
  billingUnit: z.string().nullish(),
  referencePoints: z.number().nullish(),
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
  const params = model.supportParams;
  const resolutionsByMode = { ...(params.resolutionsByMode ?? {}) };
  for (const mode of model.supportModes) {
    if (!resolutionsByMode[mode]?.length) {
      resolutionsByMode[mode] = [...params.resolutions];
    }
  }

  const fallbackDuration = params.defaults.duration ?? 1;
  const durationMin = params.durationMin ?? Math.min(...params.durations, fallbackDuration);
  const durationMax = params.durationMax ?? Math.max(...params.durations, fallbackDuration);

  return {
    value: model.modelCode,
    label: model.modelName,
    modes,
    params: {
      ratios: params.ratios,
      resolutions: params.resolutions,
      resolutionsByMode,
      durations: params.durations,
      durationMin,
      durationMax,
      defaults: params.defaults,
    },
  };
}

function mapPrice(price: z.infer<typeof priceSchema>, input: VideoPriceRequest): VideoPrice {
  return {
    priceVersion: price.priceVersion,
    unitPoints: price.unitPoints,
    billingUnit: price.billingUnit ?? "legacy_5_seconds",
    referencePoints: price.referencePoints ?? 0,
    durationSeconds: price.durationSeconds ?? input.duration,
    requiredPoints: price.requiredPoints,
    currentPoints: price.currentPoints,
    shortagePoints: price.shortagePoints,
    enough: price.enough,
    detail: price.detail,
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
    unitPoints: task.unitPoints,
    billingUnit: task.billingUnit ?? "legacy_5_seconds",
    referencePoints: task.referencePoints ?? 0,
    requiredPoints: task.requiredPoints,
    failReason: task.failReason,
    results,
    createTime: task.createTime,
  };
}

async function readModelRecords() {
  const payload = await requestJavaApiData<unknown>("/generation/user/video/models");
  return z.array(modelSchema).parse(payload);
}

async function buildCompatibleRequest(input: VideoPriceRequest | CreateVideoTaskRequest) {
  const models = await readModelRecords();
  const model = models.find((item) => item.modelCode === input.model);
  const params = model?.supportParams;
  const quality = params?.defaults.quality ?? params?.qualities?.[0] ?? "standard";
  const audio = params?.defaults.audio ?? params?.audios?.[0] ?? false;

  return {
    ...input,
    modelCode: input.model,
    durationSeconds: input.duration,
    quality,
    audio,
  };
}

export async function listVideoModels(): Promise<VideoModel[]> {
  const models = await readModelRecords();
  return models.map(mapModel);
}

export async function estimateVideoPrice(input: VideoPriceRequest): Promise<VideoPrice> {
  const requestBody = await buildCompatibleRequest(input);
  const payload = await requestJavaApiData<unknown>("/generation/user/video/price/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  const price = priceSchema.parse(payload);
  return mapPrice(price, input);
}

export async function createVideoTask(input: CreateVideoTaskRequest): Promise<VideoTask> {
  const requestBody = await buildCompatibleRequest(input);
  const payload = await requestJavaApiData<unknown>("/generation/user/video/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
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
