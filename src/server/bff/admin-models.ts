import "server-only";

import { z } from "zod";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import type { AdminGenerationModel, SaveAdminGenerationModelRequest } from "@/types/admin";

const modeSchema = z.object({
  id: javaIdSchema.optional(),
  modeCode: z.string(),
  modeName: z.string(),
  status: z.enum(["enabled", "disabled"]),
  sortOrder: z.number(),
});

const paramSchema = z.object({
  id: javaIdSchema.optional(),
  modeCode: z.string(),
  paramType: z.enum(["ratio", "resolution", "quality", "format", "count", "duration", "audio"]),
  paramValue: z.string(),
  paramLabel: z.string(),
  defaultFlag: z.number(),
  sortOrder: z.number(),
});

const priceSchema = z.object({
  id: javaIdSchema.optional(),
  modeCode: z.string(),
  resolution: z.string(),
  quality: z.string(),
  points: z.number(),
  priceVersion: z.string().optional(),
  status: z.enum(["enabled", "disabled"]),
});

const modelSchema = z.object({
  id: javaIdSchema,
  modelCode: z.string(),
  modelName: z.string(),
  provider: z.string(),
  apiBaseUrl: z.string(),
  hasApiKey: z.boolean(),
  apiKeyPreview: z.string().nullable().optional(),
  modelType: z.enum(["image", "video"]),
  status: z.enum(["enabled", "disabled"]),
  defaultFlag: z.number(),
  sortOrder: z.number(),
  remark: z.string().nullable().optional(),
  priceVersion: z.string(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  modes: z.array(modeSchema),
  params: z.array(paramSchema),
  prices: z.array(priceSchema),
});

function mapModel(model: z.infer<typeof modelSchema>): AdminGenerationModel {
  return {
    id: model.id,
    modelCode: model.modelCode,
    modelName: model.modelName,
    provider: model.provider,
    apiBaseUrl: model.apiBaseUrl,
    hasApiKey: model.hasApiKey,
    apiKeyPreview: model.apiKeyPreview ?? null,
    modelType: model.modelType,
    status: model.status,
    defaultFlag: model.defaultFlag,
    sortOrder: model.sortOrder,
    remark: model.remark ?? null,
    priceVersion: model.priceVersion,
    createdAt: model.createdAt ?? null,
    updatedAt: model.updatedAt ?? null,
    modes: model.modes,
    params: model.params,
    prices: model.prices,
  };
}

export async function listAdminModels() {
  const payload = await requestJavaApiData<unknown>("/generation/admin/models");
  return z.array(modelSchema).parse(payload).map(mapModel);
}

export async function saveAdminModel(id: string | null, input: SaveAdminGenerationModelRequest) {
  const path = id
    ? `/generation/admin/models/${encodeURIComponent(id)}`
    : "/generation/admin/models";
  const method = id ? "PUT" : "POST";
  const payload = await requestJavaApiData<unknown>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return mapModel(modelSchema.parse(payload));
}

export async function updateAdminModelStatus(id: string, status: "enabled" | "disabled") {
  const payload = await requestJavaApiData<unknown>(
    `/generation/admin/models/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  return mapModel(modelSchema.parse(payload));
}

export async function setAdminModelDefault(id: string) {
  const payload = await requestJavaApiData<unknown>(
    `/generation/admin/models/${encodeURIComponent(id)}/default`,
    { method: "PATCH" },
  );
  return mapModel(modelSchema.parse(payload));
}

export async function deleteAdminModel(id: string) {
  await requestJavaApiData<unknown>(`/generation/admin/models/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
