import type {
  GenerationConversationApiItem,
  GenerationMode,
  GenerationOutputFormat,
  GenerationModelOption,
  GenerationQualityOption,
  GenerationTaskStatus,
  UploadedMediaApiItem,
} from "@/types/generation";

export type QualityOption = GenerationQualityOption;

export type GenerationOptions = {
  mode: GenerationMode;
  model: string;
  ratio: string;
  resolution: string;
  quality: QualityOption;
  format: GenerationOutputFormat;
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
  imageCount: number;
  costCredits: number;
  createdAt: string;
  imageUrls?: string[];
};

export const taskStatusLabels: Record<GenerationTaskStatus, string> = {
  queued: "排队中",
  running: "生成中",
  succeeded: "已完成",
  failed: "失败",
};

const sizes: Record<string, Record<string, string>> = {
  "1K": {
    "1:1": "1024x1024",
    "16:9": "1360x768",
    "9:16": "768x1360",
    "4:3": "1152x864",
    "3:4": "864x1152",
  },
  "2K": {
    "1:1": "1536x1536",
    "16:9": "2048x1152",
    "9:16": "1152x2048",
    "4:3": "1792x1344",
    "3:4": "1344x1792",
  },
  "4K": {
    "1:1": "2048x2048",
    "16:9": "3840x2160",
    "9:16": "1216x2160",
    "4:3": "2816x2112",
    "3:4": "1584x2112",
  },
};

export function getGenerationSize(options: GenerationOptions) {
  const resolutionSizes = sizes[options.resolution];
  if (!resolutionSizes) {
    return `${options.resolution} · ${options.ratio}`;
  }

  return resolutionSizes[options.ratio] || `${options.resolution} · ${options.ratio}`;
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
    resolution: params.defaults.resolution,
    quality: params.defaults.quality,
    format: params.defaults.format,
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
    resolution: pickValue(options.resolution, params.resolutions, params.defaults.resolution),
    quality: pickValue(options.quality, params.qualities, params.defaults.quality),
    format: pickValue(options.format, params.formats, params.defaults.format),
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
