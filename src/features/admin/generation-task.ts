import type { AdminGenerationTask } from "@/types/admin";
import { isTaskRetrying } from "@/utils/task-status";

const taskStatusLabels: Record<string, string> = {
  pending: "生成中",
  processing: "生成中",
  succeeded: "已完成",
  failed: "失败",
};

function isTaskRunning(status: string) {
  return status === "pending" || status === "processing";
}

function readTaskStatus(task: AdminGenerationTask) {
  if (isTaskRetrying(task)) return "重试中";
  return taskStatusLabels[task.status] ?? task.status;
}

// 失败或重试中的任务用最近一次错误作为状态提示
function readTaskError(task: AdminGenerationTask) {
  const isActive = task.status === "failed" || isTaskRetrying(task);
  if (!isActive) return undefined;
  return task.lastError || task.failReason || undefined;
}

function hasTaskRetries(task: AdminGenerationTask) {
  return (task.attemptCount ?? 0) > 1;
}

function readTaskAttempts(task: AdminGenerationTask) {
  const count = task.attemptCount ?? 0;
  return `${count}/${task.maxAttempts ?? count}`;
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
  hasTaskRetries,
  isTaskRunning,
  readTaskAttempts,
  readTaskError,
  readTaskStatus,
  readTaskModel,
  readTaskOutputCount,
  readTaskSource,
  readTaskSpec,
  readTaskType,
  taskStatusLabels,
};
