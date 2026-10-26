import type { VideoTaskStatus } from "@/types/video";

export type VideoStage = "idle" | "queued" | "generating" | "retrying" | "completed" | "failed";

export type VideoRatio = {
  width: number;
  height: number;
};

const stageByStatus: Record<VideoTaskStatus, VideoStage> = {
  pending: "queued",
  processing: "generating",
  succeeded: "completed",
  failed: "failed",
};

export const videoStageLabels: Record<VideoStage, string> = {
  idle: "",
  queued: "排队中",
  generating: "正在生成视频",
  retrying: "重试中",
  completed: "已完成",
  failed: "视频生成失败",
};

export const videoStageHints: Record<VideoStage, string> = {
  idle: "",
  queued: "任务已提交，等待开始生成",
  generating: "AI 正在构建画面与运动",
  retrying: "上次请求未成功，正在自动重试",
  completed: "",
  failed: "",
};

const defaultFailReason = "生成未完成，请稍后重试";
const javaTimePattern = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?$/;

export function getVideoStage(status: string | null | undefined, retrying = false): VideoStage {
  if (!status || !Object.hasOwn(stageByStatus, status)) {
    return "idle";
  }

  const stage = stageByStatus[status as VideoTaskStatus];
  if (retrying && isVideoRunning(stage)) {
    return "retrying";
  }
  return stage;
}

export function isVideoRunning(stage: VideoStage) {
  return stage === "queued" || stage === "generating" || stage === "retrying";
}

// Java LocalDateTime 不带时区，按浏览器本地时间解析
export function parseJavaTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const match = javaTimePattern.exec(value.trim());
  if (match) {
    const millis = (match[7] ?? "").slice(0, 3).padEnd(3, "0");
    const date = new Date(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6] ?? 0),
      Number(millis),
    );
    return date.getTime();
  }

  const time = Date.parse(value);
  if (Number.isNaN(time)) {
    return null;
  }
  return time;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatElapsed(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${pad(seconds)}s`;
  }
  return `${seconds}s`;
}

export function parseRatio(value: string | null | undefined): VideoRatio | null {
  const match = /^\s*(\d+(?:\.\d+)?)\s*[:/x]\s*(\d+(?:\.\d+)?)\s*$/.exec(value ?? "");
  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

export function formatVideoTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }
  return value.slice(0, 16).replace("T", " ");
}

export function shortFailReason(value: string | null | undefined) {
  const line = (value ?? "").trim().split("\n")[0]?.replace(/\s+/g, " ") ?? "";
  if (!line || line.startsWith("{") || line.startsWith("[")) {
    return defaultFailReason;
  }
  return line;
}
