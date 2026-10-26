import type { GenerationTaskRetry, GenerationTaskStatus } from "@/types/generation";
import { parseJavaTime } from "./video-task.ts";

type StatusTask = GenerationTaskRetry & {
  status: string;
};

const taskStatusLabels: Record<GenerationTaskStatus, string> = {
  pending: "排队中",
  processing: "生成中",
  succeeded: "已完成",
  failed: "失败",
};

function isTaskRetrying(task: StatusTask) {
  const isActive = task.status === "pending" || task.status === "processing";
  return isActive && task.retrying === true;
}

// 第 N 次指即将开始（pending）或正在进行（processing）的那次尝试
function getRetryAttempt(task: StatusTask) {
  const count = task.attemptCount ?? 0;
  if (task.status === "pending") {
    return count + 1;
  }

  return Math.max(count, 1);
}

// 距离下一次尝试的秒数，没有等待时返回 0
function getRetryWait(task: StatusTask, now: number) {
  if (!isTaskRetrying(task) || task.status !== "pending") {
    return 0;
  }

  const next = parseJavaTime(task.nextAttemptTime);
  if (next === null || next <= now) {
    return 0;
  }

  return Math.ceil((next - now) / 1000);
}

function getRetryLabel(task: StatusTask, now?: number) {
  const label = `重试中（第 ${getRetryAttempt(task)} 次）`;
  if (now === undefined) {
    return label;
  }

  const wait = getRetryWait(task, now);
  if (wait <= 0) {
    return label;
  }

  return `${label} · ${wait}s 后`;
}

function getTaskStatusLabel(task: StatusTask, now?: number) {
  if (isTaskRetrying(task)) {
    return getRetryLabel(task, now);
  }

  if (Object.hasOwn(taskStatusLabels, task.status)) {
    return taskStatusLabels[task.status as GenerationTaskStatus];
  }

  return task.status;
}

export {
  getRetryAttempt,
  getRetryLabel,
  getRetryWait,
  getTaskStatusLabel,
  isTaskRetrying,
  taskStatusLabels,
};
