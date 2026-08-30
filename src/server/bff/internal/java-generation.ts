import "server-only";

import { z } from "zod";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import type {
  GenerationMode,
  GenerationModelOption,
  GenerationModelParams,
  GenerationOutput,
  GenerationPriceRequest,
  GenerationPriceResponse,
  GenerationTaskView,
} from "@/types/generation";

const qualitySchema = z.string().trim().min(1);

const javaModelDefaultsSchema = z.object({
  mode: z.string(),
  ratio: z.string(),
  quality: qualitySchema,
  count: z.number(),
});

const javaModelParamsSchema = z.object({
  ratios: z.array(z.string()),
  qualities: z.array(qualitySchema),
  counts: z.array(z.number()),
  defaults: javaModelDefaultsSchema,
});

const javaModelSchema = z.object({
  modelCode: z.string(),
  modelName: z.string(),
  modelType: z.string(),
  supportModes: z.array(z.string()),
  supportParams: javaModelParamsSchema,
  defaultFlag: z.number(),
});

const javaConversationSchema = z.object({
  id: javaIdSchema,
  title: z.string(),
  lastTaskAt: z.string().nullable().optional(),
  updatedAt: z.string(),
  createdAt: z.string(),
  count: z.object({ tasks: z.number() }),
  tasks: z.array(z.object({ status: z.string(), costCredits: z.number() })),
});

const javaResultSchema = z.object({
  id: javaIdSchema,
  mediaAssetId: javaIdSchema.nullable().optional(),
  resultUrl: z.string().nullable().optional(),
});

const javaTaskSchema = z.object({
  id: javaIdSchema,
  taskNo: z.string(),
  modelCode: z.string(),
  mode: z.string(),
  prompt: z.string(),
  ratio: z.string(),
  resolution: z.string(),
  quality: z.string(),
  format: z.string(),
  count: z.number(),
  unitPoints: z.number(),
  requiredPoints: z.number(),
  status: z.string(),
  failReason: z.string().nullable().optional(),
  results: z.array(javaResultSchema),
  createTime: z.string(),
});

const javaPriceSchema = z.object({
  priceVersion: z.string(),
  unitPoints: z.number(),
  count: z.number(),
  requiredPoints: z.number(),
  currentPoints: z.number(),
  shortagePoints: z.number(),
  enough: z.boolean(),
  detail: z.string(),
});

const javaTaskPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(javaTaskSchema),
});

type JavaTask = z.infer<typeof javaTaskSchema>;

type TaskInput = {
  userProfileId: string;
  conversationId: string;
  model: string;
  prompt: string;
  mode: "text" | "edit";
  quality: string;
  ratio: string;
  count: number;
  referenceMediaId?: string;
};

function parseDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

function mapStatus(status: string) {
  if (status === "pending") return "queued" as const;
  if (status === "processing") return "running" as const;
  if (status === "succeeded") return "succeeded" as const;
  return "failed" as const;
}

function mapMode(mode: string) {
  return mode === "image_to_image" ? ("edit" as const) : ("text" as const);
}

function toJavaMode(mode: GenerationMode) {
  return mode === "edit" ? "image_to_image" : "text_to_image";
}

function mapSize(resolution: string, ratio: string) {
  if (resolution === "adaptive") return ratio;
  const sizes: Record<string, string> = {
    "1K:1:1": "1024x1024",
    "1K:16:9": "1360x768",
    "1K:9:16": "768x1360",
    "1K:4:3": "1152x864",
    "1K:3:4": "864x1152",
    "2K:1:1": "1536x1536",
    "2K:16:9": "2048x1152",
    "2K:9:16": "1152x2048",
    "2K:4:3": "1792x1344",
    "2K:3:4": "1344x1792",
    "4K:1:1": "2048x2048",
    "4K:16:9": "3840x2160",
    "4K:9:16": "1216x2160",
    "4K:4:3": "2816x2112",
    "4K:3:4": "1584x2112",
  };

  const size = sizes[`${resolution}:${ratio}`];
  if (size) {
    return size;
  }

  return `${resolution} · ${ratio}`;
}

function mapOutputs(task: JavaTask) {
  const outputs: GenerationOutput[] = [];

  for (const [index, result] of task.results.entries()) {
    if (result.mediaAssetId === null || result.mediaAssetId === undefined) {
      continue;
    }

    const assetId = String(result.mediaAssetId);
    const output: GenerationOutput = {
      id: String(result.id || `${task.taskNo}-${index}`),
      width: null,
      height: null,
      outputAsset: {
        id: assetId,
        fileName: null,
        width: null,
        height: null,
      },
      thumbnailAsset: null,
      galleryImage: null,
    };

    outputs.push(output);
  }

  return outputs;
}

function mapTask(task: JavaTask): GenerationTaskView {
  const outputs = mapOutputs(task);

  return {
    id: task.taskNo,
    prompt: task.prompt,
    mode: mapMode(task.mode),
    status: mapStatus(task.status),
    model: task.modelCode,
    size: mapSize(task.resolution, task.ratio),
    ratio: task.ratio,
    resolution: task.resolution,
    quality: task.quality as GenerationTaskView["quality"],
    outputFormat: task.format as GenerationTaskView["outputFormat"],
    imageCount: task.count,
    costCredits: task.requiredPoints,
    unitCostCredits: task.unitPoints,
    createdAt: new Date(task.createTime),
    updatedAt: new Date(task.createTime),
    outputs,
    error: task.failReason || null,
  };
}

function parseConversations(payload: unknown) {
  const items = z.array(javaConversationSchema).parse(payload);
  return items.map((item) => {
    const result = {
      id: String(item.id),
      title: item.title,
      lastTaskAt: parseDate(item.lastTaskAt),
      updatedAt: new Date(item.updatedAt),
      createdAt: new Date(item.createdAt),
      _count: item.count,
      tasks: item.tasks.map((task) => {
        return {
          status: mapStatus(task.status),
          costCredits: task.costCredits,
        };
      }),
    };

    return result;
  });
}

export async function listConversations() {
  const payload = await requestJavaApiData<unknown>("/generation/user/conversations");
  return parseConversations(payload);
}

export async function listModels() {
  const params = new URLSearchParams({
    modelType: "image",
  });
  const payload = await requestJavaApiData<unknown>(`/generation/user/models?${params.toString()}`);
  const javaModels = z.array(javaModelSchema).parse(payload);
  return javaModels.map((javaModel): GenerationModelOption => {
    const params: GenerationModelParams = javaModel.supportParams;
    const modes = javaModel.supportModes.map((mode) => mapMode(mode));
    return {
      value: javaModel.modelCode,
      label: javaModel.modelName,
      modes,
      defaultMode: modes[0] ?? "text",
      params: Object.fromEntries(modes.map((mode) => [mode, params])),
    };
  });
}

export async function createConversation(title: string) {
  const payload = await requestJavaApiData<unknown>("/generation/user/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const conversations = parseConversations([payload]);
  return conversations[0];
}

export async function updateTitle(conversationId: string, title: string) {
  const payload = await requestJavaApiData<unknown>(
    `/generation/user/conversations/${encodeURIComponent(conversationId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    },
  );
  return parseConversations([payload])[0];
}

export async function remove(conversationId: string) {
  await requestJavaApiData<unknown>(
    `/generation/user/conversations/${encodeURIComponent(conversationId)}`,
    { method: "DELETE" },
  );
}

export async function requireOwned(conversationId: string) {
  const conversations = await listConversations();
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    throw new Error("对话不存在");
  }
  return conversation;
}

export async function listTasks(conversationId: string) {
  const payload = await requestJavaApiData<unknown>(
    `/generation/user/conversations/${encodeURIComponent(conversationId)}/tasks`,
  );
  const tasks = z.array(javaTaskSchema).parse(payload);
  return tasks.map(mapTask);
}

type HistoryInput = {
  page?: number;
  pageSize?: number;
  from?: Date;
  to?: Date;
  sort?: "asc" | "desc";
  modelType?: "image" | "video";
};

export async function listHistory(input: HistoryInput = {}) {
  const params = new URLSearchParams({
    pageNo: String(input.page || 1),
    pageSize: String(input.pageSize || 20),
    isAsc: input.sort === "asc" ? "true" : "false",
    sortBy: "create_time",
  });

  if (input.from) {
    params.set("beginTime", formatJavaDate(input.from));
  }
  if (input.to) {
    params.set("endTime", formatJavaDate(input.to));
  }
  if (input.modelType) {
    params.set("modelType", input.modelType);
  }

  const payload = await requestJavaApiData<unknown>(`/generation/user/tasks?${params.toString()}`);
  const page = javaTaskPageSchema.parse(payload);

  return {
    total: page.total,
    pages: page.pages,
    list: page.list.map(mapTask),
  };
}

function formatJavaDate(date: Date) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));

  return `${values.get("year")}-${values.get("month")}-${values.get("day")}T${values.get("hour")}:${values.get("minute")}:${values.get("second")}`;
}

export async function getTask(taskNo: string) {
  const payload = await requestJavaApiData<unknown>(
    `/generation/user/tasks/${encodeURIComponent(taskNo)}`,
  );
  return mapTask(javaTaskSchema.parse(payload));
}

export async function createTask(input: TaskInput) {
  const mode = input.mode === "edit" ? "image_to_image" : "text_to_image";
  const quality = input.quality;
  await estimatePrice({
    model: input.model,
    mode: input.mode,
    ratio: input.ratio,
    quality,
    count: input.count,
  });

  if (mode === "image_to_image" && !input.referenceMediaId) {
    throw new Error("图生图需要 1 张参考图");
  }

  const payload = await requestJavaApiData<unknown>("/generation/user/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modelCode: input.model,
      conversationId: input.conversationId,
      mode,
      prompt: input.prompt,
      referenceMediaId: input.referenceMediaId ?? null,
      ratio: input.ratio,
      quality,
      count: input.count,
    }),
  });

  return mapTask(javaTaskSchema.parse(payload));
}

export async function estimatePrice(
  input: GenerationPriceRequest,
): Promise<GenerationPriceResponse> {
  const payload = await requestJavaApiData<unknown>("/generation/user/price/estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      modelCode: input.model,
      mode: toJavaMode(input.mode),
      ratio: input.ratio,
      quality: input.quality,
      count: input.count,
    }),
  });
  const price = javaPriceSchema.parse(payload);

  return {
    priceVersion: price.priceVersion,
    unitPoints: price.unitPoints,
    imageCount: price.count,
    requiredPoints: price.requiredPoints,
    currentPoints: price.currentPoints,
    shortagePoints: price.shortagePoints,
    enough: price.enough,
    detail: price.detail,
  };
}

export async function getMediaSignedUrl(assetId: string, isPublic = false) {
  const route = isPublic ? "public-assets" : "assets";
  return `/api/media/${route}/${encodeURIComponent(assetId)}`;
}
