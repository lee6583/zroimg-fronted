import type {
  GenerationConversation,
  GenerationMode,
  GenerationModel,
  GenerationTask,
  GenerationTaskStatus,
} from "@/types/generation";

export type GenerationOptions = {
  mode: GenerationMode;
  modelCode: string;
  ratio: string;
  quality: string;
  count: number;
};

export type Notice = {
  text: string;
  tone: "info" | "error";
} | null;

export type ConversationGroup = {
  key: string;
  label: string;
  items: GenerationConversation[];
};

export const activeConversationCookieName = "zroimg-active-generation-conversation";

export const imageModes: GenerationMode[] = ["text_to_image", "image_to_image"];

export const modeLabels: Record<GenerationMode, string> = {
  text_to_image: "文生图",
  image_to_image: "图生图",
};

export const taskStatusLabels: Record<GenerationTaskStatus, string> = {
  pending: "排队中",
  processing: "生成中",
  succeeded: "已完成",
  failed: "失败",
};

export function isTaskPending(task: Pick<GenerationTask, "status">) {
  return task.status === "pending" || task.status === "processing";
}

export function supportsMode(model: GenerationModel, mode: GenerationMode) {
  return model.supportModes.includes(mode);
}

export function getDefaultOptions(models: GenerationModel[]): GenerationOptions {
  const model = models.find((item) => item.defaultFlag === 1) ?? models[0];
  if (!model) {
    throw new Error("暂无可用图片模型");
  }

  const params = model.supportParams;
  const defaults = params.defaults;
  let mode = imageModes.find((item) => item === defaults.mode);
  if (!mode) {
    mode = imageModes.find((item) => supportsMode(model, item));
  }
  if (!mode) {
    throw new Error("图片模型缺少生成模式配置");
  }

  return {
    mode,
    modelCode: model.modelCode,
    ratio: defaults.ratio ?? params.ratios[0] ?? "",
    quality: defaults.quality ?? params.qualities[0] ?? "",
    count: defaults.count ?? params.counts[0] ?? 1,
  };
}

export function normalizeOptions(
  options: GenerationOptions,
  models: GenerationModel[],
): GenerationOptions {
  let model = models.find((item) => {
    const isSelected = item.modelCode === options.modelCode;
    return isSelected && supportsMode(item, options.mode);
  });

  if (!model) {
    model = models.find((item) => supportsMode(item, options.mode));
  }
  if (!model) {
    throw new Error("当前生成模式没有可用模型");
  }

  const params = model.supportParams;
  const defaults = params.defaults;

  return {
    mode: options.mode,
    modelCode: model.modelCode,
    ratio: pickValue(options.ratio, params.ratios, defaults.ratio ?? params.ratios[0] ?? ""),
    quality: pickValue(
      options.quality,
      params.qualities,
      defaults.quality ?? params.qualities[0] ?? "",
    ),
    count: pickValue(options.count, params.counts, defaults.count ?? params.counts[0] ?? 1),
  };
}

function pickValue<Value>(value: Value, values: Value[], defaultValue: Value) {
  if (values.includes(value)) {
    return value;
  }

  return defaultValue;
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

export function groupConversations(items: GenerationConversation[]) {
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
