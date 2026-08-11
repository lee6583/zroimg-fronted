import "server-only";

import { z } from "zod";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import type {
  AdminGenerationModel,
  ImageModelCatalogItem,
  SaveAdminGenerationModelRequest,
} from "@/types/admin";

const modelSchema = z.object({
  id: javaIdSchema,
  modelCode: z.string(),
  modelName: z.string(),
  adapter: z.enum(["openai", "grok"]),
  apiBaseUrl: z.string(),
  hasApiKey: z.boolean(),
  status: z.enum(["enabled", "disabled"]),
  defaultFlag: z.number(),
  sortOrder: z.number(),
  imageToImageEnabled: z.boolean(),
  supportedRatios: z.array(z.string()),
  supportedQualities: z.array(z.string()),
  maxCount: z.number(),
  pointsByQuality: z.record(z.string(), z.number()),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

const catalogSchema = z.object({
  modelCode: z.string(),
  modelName: z.string(),
  adapter: z.enum(["openai", "grok"]),
  defaultApiBaseUrl: z.string(),
  imageToImageSupported: z.boolean(),
  ratios: z.array(z.string()),
  qualities: z.array(z.string()),
  maxCount: z.number(),
  defaultPoints: z.record(z.string(), z.number()),
});

function mapModel(model: z.infer<typeof modelSchema>): AdminGenerationModel {
  return {
    id: model.id,
    modelCode: model.modelCode,
    modelName: model.modelName,
    adapter: model.adapter,
    apiBaseUrl: model.apiBaseUrl,
    hasApiKey: model.hasApiKey,
    status: model.status,
    defaultFlag: model.defaultFlag,
    sortOrder: model.sortOrder,
    imageToImageEnabled: model.imageToImageEnabled,
    supportedRatios: model.supportedRatios,
    supportedQualities: model.supportedQualities,
    maxCount: model.maxCount,
    pointsByQuality: model.pointsByQuality,
    createdAt: model.createdAt ?? null,
    updatedAt: model.updatedAt ?? null,
  };
}

export async function listAdminModels() {
  const payload = await requestJavaApiData<unknown>("/generation/admin/models");
  return z.array(modelSchema).parse(payload).map(mapModel);
}

export async function listImageModelCatalog(): Promise<ImageModelCatalogItem[]> {
  const payload = await requestJavaApiData<unknown>("/generation/admin/models/catalog");
  return z.array(catalogSchema).parse(payload);
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
