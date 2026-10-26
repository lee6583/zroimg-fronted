import type { AdminGenerationTask } from "@/types/admin";

const taskStatusLabels: Record<string, string> = {
  pending: "生成中",
  processing: "生成中",
  succeeded: "已完成",
  failed: "失败",
};

function isTaskRunning(status: string) {
  return status === "pending" || status === "processing";
}

function readTaskType(task: AdminGenerationTask) {
  if (task.modelType === "video") return "视频";
  if (task.mode === "image_to_image") return "图生图";
  if (task.mode === "inpaint") return "局部重绘";
  return "文生图";
}

function readTaskSource(task: AdminGenerationTask) {
  if (task.canvasId) return "画布";
  return "对话";
}

function readTaskModel(task: AdminGenerationTask) {
  return task.modelName || task.modelCode;
}

function readTaskSpec(task: AdminGenerationTask) {
  const parts = [task.resolution, task.ratio, task.quality].filter(Boolean);
  if (parts.length === 0) return "-";
  return parts.join(" · ");
}

function readTaskOutputCount(task: AdminGenerationTask) {
  return task.results?.length ?? 0;
}

export {
  isTaskRunning,
  readTaskModel,
  readTaskOutputCount,
  readTaskSource,
  readTaskSpec,
  readTaskType,
  taskStatusLabels,
};
