import type {
  GenerationConversationApiItem,
  GenerationMode,
  GenerationOutputFormat,
  GenerationQuality,
  GenerationTaskStatus,
  UploadedMediaApiItem,
} from "@/types/generation";
import { estimateGenerationCredits } from "@/utils/generation-credits";

export type QualityOption = GenerationQuality | "auto";
export type Ratio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
export type Resolution = "1K" | "2K" | "4K";

export type GenerationOptions = {
  mode: GenerationMode;
  model: string;
  ratio: Ratio;
  resolution: Resolution;
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

export const defaultOptions: GenerationOptions = {
  mode: "text",
  model: "gpt-image-2",
  ratio: "1:1",
  resolution: "1K",
  quality: "auto",
  format: "png",
  count: 1,
};

export const modelOptions = [{ value: "gpt-image-2", label: "gpt-image-2" }];
export const ratios: Ratio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];
export const resolutions: Resolution[] = ["1K", "2K", "4K"];
export const qualities: Array<{ value: QualityOption; label: string }> = [
  { value: "auto", label: "自动" },
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
];
export const formats: Array<{
  value: GenerationOutputFormat;
  label: string;
}> = [
  { value: "webp", label: "WebP" },
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
];
export const imageCounts = [1, 2, 4];
export const promptSuggestions = [
  "一只在星空下弹吉他的猫",
  "未来城市的日落景色",
  "水彩风格的樱花园",
];
export const taskStatusLabels: Record<GenerationTaskStatus, string> = {
  queued: "排队中",
  running: "生成中",
  succeeded: "已完成",
  failed: "失败",
};

const sizes: Record<Resolution, Record<Ratio, string>> = {
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
  return sizes[options.resolution][options.ratio];
}

export function getGenerationQuality(quality: QualityOption): GenerationQuality {
  return quality === "auto" ? "medium" : quality;
}

export function estimateOptionsCredits(options: GenerationOptions) {
  return estimateGenerationCredits({
    mode: options.mode,
    quality: getGenerationQuality(options.quality),
    size: getGenerationSize(options),
    count: options.count,
  });
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
