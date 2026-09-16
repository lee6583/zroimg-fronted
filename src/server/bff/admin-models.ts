import "server-only";

import { z } from "zod";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import type {
  AdminGenerationModel,
  DiscoveredProviderModel,
  DiscoverProviderModelsRequest,
  GenerationModelCatalogItem,
  GenerationProviderConnection,
  SaveAdminGenerationModelRequest,
  SaveProviderConnectionRequest,
} from "@/types/admin";

const modelSchema = z.object({
  id: javaIdSchema,
  modelCode: z.string(),
  modelName: z.string(),
  modelType: z.enum(["image", "video"]),
  adapter: z.enum(["openai", "grok", "generic-video"]),
  connectionId: javaIdSchema.nullable(),
  connectionName: z.string().nullable(),
  providerModelCode: z.string(),
  capabilityProfile: z.string(),
  verificationStatus: z.enum(["verified", "unverified"]),
  verifiedAt: z.string().nullable(),
  apiBaseUrl: z.string().nullable(),
  hasApiKey: z.boolean(),
  apiKeyPreview: z.string().nullable(),
  status: z.enum(["enabled", "disabled"]),
  defaultFlag: z.number(),
  sortOrder: z.number(),
  imageToImageEnabled: z.boolean(),
  imageToVideoEnabled: z.boolean(),
  supportedRatios: z.array(z.string()),
  supportedQualities: z.array(z.string()),
  supportedResolutions: z.array(z.string()),
  minDuration: z.number().nullable(),
  maxDuration: z.number().nullable(),
  maxCount: z.number(),
  pointsByQuality: z.record(z.string(), z.number()),
  pointsPerSecondByResolution: z.record(z.string(), z.number()),
  referencePointsByResolution: z.record(z.string(), z.number()),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

const catalogSchema = z.object({
  modelCode: z.string(),
  capabilityProfile: z.string(),
  modelName: z.string(),
  modelType: z.enum(["image", "video"]),
  adapter: z.enum(["openai", "grok"]),
  defaultApiBaseUrl: z.string(),
  imageToImageSupported: z.boolean(),
  imageToVideoSupported: z.boolean(),
  ratios: z.array(z.string()),
  qualities: z.array(z.string()),
  resolutions: z.array(z.string()),
  minDuration: z.number().nullable(),
  maxDuration: z.number().nullable(),
  maxCount: z.number(),
  defaultPoints: z.record(z.string(), z.number()),
  defaultPointsPerSecond: z.record(z.string(), z.number()),
  defaultReferencePoints: z.record(z.string(), z.number()),
});

const connectionSchema = z.object({
  id: javaIdSchema,
  name: z.string(),
  adapter: z.enum(["openai", "grok"]),
  apiBaseUrl: z.string(),
  status: z.enum(["enabled", "disabled"]),
  hasApiKey: z.boolean(),
  apiKeyPreview: z.string().nullable(),
  modelCount: z.number(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
});

const discoveredModelSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  ownedBy: z.string(),
  object: z.string(),
});

function mapModel(model: z.infer<typeof modelSchema>): AdminGenerationModel {
  return {
    id: model.id,
    modelCode: model.modelCode,
    modelName: model.modelName,
    modelType: model.modelType,
    adapter: model.adapter,
    connectionId: model.connectionId,
    connectionName: model.connectionName,
    providerModelCode: model.providerModelCode,
    capabilityProfile: model.capabilityProfile,
    verificationStatus: model.verificationStatus,
    verifiedAt: model.verifiedAt,
    apiBaseUrl: model.apiBaseUrl,
    hasApiKey: model.hasApiKey,
    apiKeyPreview: model.apiKeyPreview,
    status: model.status,
    defaultFlag: model.defaultFlag,
    sortOrder: model.sortOrder,
    imageToImageEnabled: model.imageToImageEnabled,
    imageToVideoEnabled: model.imageToVideoEnabled,
    supportedRatios: model.supportedRatios,
    supportedQualities: model.supportedQualities,
    supportedResolutions: model.supportedResolutions,
    minDuration: model.minDuration,
    maxDuration: model.maxDuration,
    maxCount: model.maxCount,
    pointsByQuality: model.pointsByQuality,
    pointsPerSecondByResolution: model.pointsPerSecondByResolution,
    referencePointsByResolution: model.referencePointsByResolution,
    createdAt: model.createdAt ?? null,
    updatedAt: model.updatedAt ?? null,
  };
}

function mapConnection(connection: z.infer<typeof connectionSchema>): GenerationProviderConnection {
  return {
    id: connection.id,
    name: connection.name,
    adapter: connection.adapter,
    apiBaseUrl: connection.apiBaseUrl,
    status: connection.status,
    hasApiKey: connection.hasApiKey,
    apiKeyPreview: connection.apiKeyPreview,
    modelCount: connection.modelCount,
    createdAt: connection.createdAt ?? null,
    updatedAt: connection.updatedAt ?? null,
  };
}

export async function listAdminModels() {
  const payload = await requestJavaApiData<unknown>("/generation/admin/models");
  return z.array(modelSchema).parse(payload).map(mapModel);
}

export async function listGenerationModelCatalog(): Promise<GenerationModelCatalogItem[]> {
  const payload = await requestJavaApiData<unknown>("/generation/admin/models/catalog");
  return z.array(catalogSchema).parse(payload);
}

export async function listProviderConnections(): Promise<GenerationProviderConnection[]> {
  const payload = await requestJavaApiData<unknown>("/generation/admin/provider-connections");
  return z.array(connectionSchema).parse(payload).map(mapConnection);
}

export async function saveProviderConnection(
  id: string | null,
  input: SaveProviderConnectionRequest,
) {
  const path = id
    ? `/generation/admin/provider-connections/${encodeURIComponent(id)}`
    : "/generation/admin/provider-connections";
  const payload = await requestJavaApiData<unknown>(path, {
    method: id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return mapConnection(connectionSchema.parse(payload));
}

export async function deleteProviderConnection(id: string) {
  await requestJavaApiData<unknown>(
    `/generation/admin/provider-connections/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export async function discoverProviderModels(
  input: DiscoverProviderModelsRequest,
): Promise<DiscoveredProviderModel[]> {
  const payload = await requestJavaApiData<unknown>(
    "/generation/admin/provider-connections/discover",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return z.array(discoveredModelSchema).parse(payload);
}

export async function discoverSavedProviderModels(id: string): Promise<DiscoveredProviderModel[]> {
  const payload = await requestJavaApiData<unknown>(
    `/generation/admin/provider-connections/${encodeURIComponent(id)}/discover`,
    { method: "POST" },
  );
  return z.array(discoveredModelSchema).parse(payload);
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
