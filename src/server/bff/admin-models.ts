import "server-only";

import { z } from "zod";
import { isJavaBffEnabled } from "@/server/env";
import { requestJavaApiData } from "@/server/java-api";
import type {
  AdminGenerationModel,
  AdminGenerationModelMode,
  AdminGenerationModelParam,
  SaveAdminGenerationModelRequest,
} from "@/types/admin";

const modeSchema = z.object({
  id: z.number().optional(),
  modeCode: z.string(),
  modeName: z.string(),
  status: z.enum(["enabled", "disabled"]),
  sortOrder: z.number(),
});

const paramSchema = z.object({
  id: z.number().optional(),
  modeCode: z.string(),
  paramType: z.enum(["ratio", "resolution", "quality", "format", "count", "duration", "audio"]),
  paramValue: z.string(),
  paramLabel: z.string(),
  defaultFlag: z.number(),
  sortOrder: z.number(),
});

const priceSchema = z.object({
  id: z.number().optional(),
  modeCode: z.string(),
  resolution: z.string(),
  quality: z.string(),
  points: z.number(),
  priceVersion: z.string().optional(),
  status: z.enum(["enabled", "disabled"]),
});

const modelSchema = z.object({
  id: z.number(),
  modelCode: z.string(),
  modelName: z.string(),
  provider: z.string(),
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
    id: String(model.id),
    modelCode: model.modelCode,
    modelName: model.modelName,
    provider: model.provider,
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

function buildMockModel(): AdminGenerationModel {
  const modes: AdminGenerationModelMode[] = [
    { modeCode: "text_to_image", modeName: "文生图", status: "enabled", sortOrder: 10 },
    { modeCode: "image_to_image", modeName: "图生图", status: "enabled", sortOrder: 20 },
  ];
  const params: AdminGenerationModelParam[] = [];
  const values = [
    ["ratio", "1:1"],
    ["ratio", "16:9"],
    ["resolution", "1K"],
    ["resolution", "2K"],
    ["quality", "auto"],
    ["quality", "medium"],
    ["format", "png"],
    ["format", "jpeg"],
    ["count", "1"],
    ["count", "2"],
  ] as const;

  values.forEach(([paramType, paramValue], index) => {
    params.push({
      modeCode: "",
      paramType,
      paramValue,
      paramLabel: paramValue,
      defaultFlag: index === 0 || index === 2 || index === 4 || index === 6 || index === 8 ? 1 : 0,
      sortOrder: index + 1,
    });
  });

  return {
    id: "mock-model-1",
    modelCode: "gpt-image-2",
    modelName: "GPT Image 2",
    provider: "openai",
    modelType: "image",
    status: "enabled",
    defaultFlag: 1,
    sortOrder: 10,
    remark: "开发期模型配置",
    priceVersion: "mock-v1",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    modes,
    params,
    prices: [
      {
        modeCode: "text_to_image",
        resolution: "1K",
        quality: "medium",
        points: 10,
        priceVersion: "mock-v1",
        status: "enabled",
      },
      {
        modeCode: "image_to_image",
        resolution: "1K",
        quality: "medium",
        points: 15,
        priceVersion: "mock-v1",
        status: "enabled",
      },
    ],
  };
}

let mockModels: AdminGenerationModel[] | null = null;

function getMockModels() {
  if (!mockModels) {
    mockModels = [buildMockModel()];
  }
  return mockModels;
}

export async function listAdminModels() {
  if (isJavaBffEnabled()) {
    const payload = await requestJavaApiData<unknown>("/generation/admin/models");
    return z.array(modelSchema).parse(payload).map(mapModel);
  }

  return getMockModels();
}

export async function saveAdminModel(id: string | null, input: SaveAdminGenerationModelRequest) {
  if (isJavaBffEnabled()) {
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

  const models = getMockModels();
  const nextModel: AdminGenerationModel = {
    ...input,
    id: id || `mock-model-${models.length + 1}`,
    remark: input.remark || null,
    priceVersion: input.priceVersion,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  if (id) {
    mockModels = models.map((model) => (model.id === id ? nextModel : model));
  } else {
    mockModels = [...models, nextModel];
  }
  return nextModel;
}

export async function updateAdminModelStatus(id: string, status: "enabled" | "disabled") {
  if (isJavaBffEnabled()) {
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

  const model = getMockModels().find((item) => item.id === id);
  if (!model) throw new Error("模型不存在");
  model.status = status;
  if (status === "disabled") model.defaultFlag = 0;
  return model;
}

export async function setAdminModelDefault(id: string) {
  if (isJavaBffEnabled()) {
    const payload = await requestJavaApiData<unknown>(
      `/generation/admin/models/${encodeURIComponent(id)}/default`,
      { method: "PATCH" },
    );
    return mapModel(modelSchema.parse(payload));
  }

  const model = getMockModels().find((item) => item.id === id);
  if (!model) throw new Error("模型不存在");
  for (const item of getMockModels()) {
    if (item.modelType === model.modelType) item.defaultFlag = item.id === id ? 1 : 0;
  }
  return model;
}

export async function deleteAdminModel(id: string) {
  if (isJavaBffEnabled()) {
    await requestJavaApiData<unknown>(`/generation/admin/models/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return;
  }

  mockModels = getMockModels().filter((model) => model.id !== id);
}
