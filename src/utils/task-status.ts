/**
 * 生成任务（图片、视频）的状态文案，文案在 `task` 命名空间（messages/<locale>/task.json）。
 *
 * 推荐用法（Client / Server 组件都适用）：
 *
 *   const tTask = useTranslations("task");          // 服务端：await getTranslations("task")
 *   getTaskStatusLabel(task, tTask);                 // "排队中" / "重试中（第 2 次）"
 *   getTaskStatusLabel(task, tTask, now);            // 等待重试时附加倒计时 "… · 12s 后"
 *   getRetryLabel(task, tTask, now);                 // 只要重试文案
 *
 * 需要自己渲染时取描述对象：getTaskStatusMessage(task, now) -> { key, values } | { key: null, text }，
 * 再 `t(message.key, message.values)`；formatTaskStatus(message, t) 做的就是这件事。
 *
 * 兼容旧调用：第二个参数省略或传数字（now）时按 zh-CN 文案返回，仅用于尚未迁移的调用方，
 * 新代码一律传入 `t`。
 */
import type { useTranslations } from "next-intl";
import type { GenerationTaskRetry, GenerationTaskStatus } from "@/types/generation";
import { parseJavaTime } from "./video-task.ts";

type StatusTask = GenerationTaskRetry & {
  status: string;
};

type TaskStatusKey = `status.${GenerationTaskStatus}` | "retrying" | "retryingWait";

type TaskStatusValues = {
  attempt: number;
  seconds?: number;
};

type TaskStatusMessage =
  | { key: TaskStatusKey; values?: TaskStatusValues; text?: undefined }
  | { key: null; values?: undefined; text: string };

/** useTranslations("task") / getTranslations("task") 返回的函数可以直接传入。 */
type TaskTranslator = ReturnType<typeof useTranslations<"task">>;

const taskStatuses: GenerationTaskStatus[] = ["pending", "processing", "succeeded", "failed"];

// 旧调用方（未传 t）使用的 zh-CN 文案，与 messages/zh-CN/task.json 保持一致。
const legacyLabels: Record<TaskStatusKey, string> = {
  "status.pending": "排队中",
  "status.processing": "生成中",
  "status.succeeded": "已完成",
  "status.failed": "失败",
  retrying: "重试中（第 {attempt} 次）",
  retryingWait: "重试中（第 {attempt} 次） · {seconds}s 后",
};

/** @deprecated 只为兼容旧代码保留；新代码用 `t(\`status.${status}\`)`。 */
const taskStatusLabels: Record<GenerationTaskStatus, string> = {
  pending: legacyLabels["status.pending"],
  processing: legacyLabels["status.processing"],
  succeeded: legacyLabels["status.succeeded"],
  failed: legacyLabels["status.failed"],
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

function getRetryMessage(task: StatusTask, now?: number): TaskStatusMessage {
  const attempt = getRetryAttempt(task);
  const wait = now === undefined ? 0 : getRetryWait(task, now);
  if (wait > 0) {
    return { key: "retryingWait", values: { attempt, seconds: wait } };
  }

  return { key: "retrying", values: { attempt } };
}

/** 状态描述对象；未知状态返回原始值（key 为 null）。 */
function getTaskStatusMessage(task: StatusTask, now?: number): TaskStatusMessage {
  if (isTaskRetrying(task)) {
    return getRetryMessage(task, now);
  }

  const status = taskStatuses.find((item) => item === task.status);
  if (status) {
    return { key: `status.${status}` };
  }

  return { key: null, text: task.status };
}

function formatLegacy(message: TaskStatusMessage) {
  if (message.key === null) {
    return message.text;
  }

  let text = legacyLabels[message.key];
  const values = message.values;
  if (values) {
    text = text.replace("{attempt}", String(values.attempt));
    text = text.replace("{seconds}", String(values.seconds ?? 0));
  }

  return text;
}

function formatTaskStatus(message: TaskStatusMessage, t?: TaskTranslator) {
  if (!t) {
    return formatLegacy(message);
  }

  if (message.key === null) {
    return message.text;
  }
  if (message.key === "retryingWait") {
    const values = message.values ?? { attempt: 1 };
    return t("retryingWait", { attempt: values.attempt, seconds: values.seconds ?? 0 });
  }
  if (message.key === "retrying") {
    return t("retrying", { attempt: message.values?.attempt ?? 1 });
  }

  return t(message.key);
}

// 第二个参数可以是 t（推荐）或旧签名里的 now。
function splitArgs(tOrNow?: TaskTranslator | number, now?: number) {
  if (typeof tOrNow === "function") {
    return { t: tOrNow, now };
  }

  return { t: undefined, now: tOrNow };
}

function getRetryLabel(task: StatusTask, tOrNow?: TaskTranslator | number, now?: number) {
  const args = splitArgs(tOrNow, now);
  return formatTaskStatus(getRetryMessage(task, args.now), args.t);
}

function getTaskStatusLabel(task: StatusTask, tOrNow?: TaskTranslator | number, now?: number) {
  const args = splitArgs(tOrNow, now);
  return formatTaskStatus(getTaskStatusMessage(task, args.now), args.t);
}

export {
  formatTaskStatus,
  getRetryAttempt,
  getRetryLabel,
  getRetryWait,
  getTaskStatusLabel,
  getTaskStatusMessage,
  isTaskRetrying,
  taskStatusLabels,
};
export type { TaskStatusKey, TaskStatusMessage, TaskTranslator };
