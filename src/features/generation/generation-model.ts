import type {
  GenerationConversationApiItem,
  GenerationMode,
  GenerationModelOption,
  GenerationQualityOption,
  GenerationTaskOutputApiItem,
  GenerationTaskStatus,
  UploadedMediaApiItem,
} from "@/types/generation";

export type QualityOption = GenerationQualityOption;

export type GenerationOptions = {
  mode: GenerationMode;
  model: string;
  ratio: string;
  quality: QualityOption;
  count: number;
};

export type MediaInput = UploadedMediaApiItem;

export type Notice = {
  text: string;
  tone: "info" | "error";
} | null;

export type ConversationItem = {
  id: string;
  title: string;
  taskCount: number;
  latestTaskStatus: string | null;
  latestTaskCost: number | null;
  lastTaskAt: string | null;
  updatedAt: string;
  createdAt: string;
};

export type ConversationGroup = {
  key: string;
  label: string;
  items: ConversationItem[];
};

export type TaskItem = {
  id: string;
  prompt: string;
  mode: GenerationMode;
  status: GenerationTaskStatus;
  size: string;
  ratio: string;
  quality: GenerationQualityOption;
  imageCount: number;
  costCredits: number;
  unitCostCredits: number;
  createdAt: string;
  outputs: GenerationTaskOutputApiItem[];
};

export type FavoriteCollectionItem = {
  id: string;
  name: string;
  imageCount: number;
};

export const activeConversationCookieName = "zroimg-active-generation-conversation";

export const taskStatusLabels: Record<GenerationTaskStatus, string> = {
  queued: "排队中",
  running: "生成中",
  succeeded: "已完成",
  failed: "失败",
};

export function getGenerationSize(options: GenerationOptions) {
  return options.ratio;
}

export function getDefaultOptions(models: GenerationModelOption[]): GenerationOptions {
  const model = models[0];
  if (!model) {
    throw new Error("暂无可用图片模型");
  }

  const mode = model.defaultMode;
  const params = model.params[mode];
  if (!params) {
    throw new Error("图片模型缺少参数配置");
  }

  return {
    mode,
    model: model.value,
    ratio: params.defaults.ratio,
    quality: params.defaults.quality,
    count: params.defaults.count,
  };
}

export function normalizeOptions(
  options: GenerationOptions,
  models: GenerationModelOption[],
): GenerationOptions {
  let model = models.find((item) => {
    const isSelectedModel = item.value === options.model;
    const supportsMode = item.modes.includes(options.mode);
    return isSelectedModel && supportsMode;
  });

  if (!model) {
    model = models.find((item) => item.modes.includes(options.mode));
  }
  if (!model) {
    throw new Error("当前生成模式没有可用模型");
  }

  const params = model.params[options.mode];
  if (!params) {
    throw new Error("图片模型缺少当前模式参数");
  }

  return {
    mode: options.mode,
    model: model.value,
    ratio: pickValue(options.ratio, params.ratios, params.defaults.ratio),
    quality: pickValue(options.quality, params.qualities, params.defaults.quality),
    count: pickValue(options.count, params.counts, params.defaults.count),
  };
}

function pickValue<Value>(value: Value, values: Value[], defaultValue: Value) {
  if (values.includes(value)) {
    return value;
  }

  return defaultValue;
}

export function normalizeConversation(item: GenerationConversationApiItem): ConversationItem {
  const latestTask = item.tasks[0];

  return {
    id: item.id,
    title: item.title,
    taskCount: item._count.tasks,
    latestTaskStatus: latestTask?.status ?? null,
    latestTaskCost: latestTask?.costCredits ?? null,
    lastTaskAt: item.lastTaskAt,
    updatedAt: item.updatedAt,
    createdAt: item.createdAt,
  };
}

export function resolveActiveConversationId(
  items: Array<{ id: string }>,
  ...preferredIds: Array<string | null | undefined>
) {
  for (const preferredId of preferredIds) {
    if (preferredId && items.some((item) => item.id === preferredId)) {
      return preferredId;
    }
  }

  return items[0]?.id ?? "";
}

export function groupConversations(items: ConversationItem[]) {
  const groups: ConversationGroup[] = [];

  for (const item of items) {
    const time = item.lastTaskAt || item.updatedAt || item.createdAt;
    const key = time.split("T")[0] || "unknown";
    const group = groups.at(-1);

    if (group?.key === key) {
      group.items.push(item);
      continue;
    }

    groups.push({
      key,
      label: key === "unknown" ? "未归档" : formatDate(time),
      items: [item],
    });
  }

  return groups;
}

function formatDate(value: string) {
  const [date] = value.split("T");
  const [year, month, day] = date.split("-");
  return year && month && day ? `${year}/${Number(month)}/${Number(day)}` : "未归档";
}
