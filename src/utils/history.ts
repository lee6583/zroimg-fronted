import { getImageResolutionLabel } from "./generation-quality.ts";

type HistoryMediaTask = {
  modelType: string;
  quality: string | null;
  resolution: string | null;
  durationSeconds: number | null;
  format: string | null;
};

function isVideoTask(task: Pick<HistoryMediaTask, "modelType">) {
  return task.modelType === "video";
}

function getMediaLabel(task: Pick<HistoryMediaTask, "modelType">) {
  if (isVideoTask(task)) {
    return "视频";
  }

  return "图片";
}

function getResolutionText(task: HistoryMediaTask) {
  if (isVideoTask(task)) {
    return task.resolution || "-";
  }

  return getImageResolutionLabel(task.quality ?? "-");
}

function getDurationText(task: HistoryMediaTask) {
  const seconds = task.durationSeconds;
  if (!isVideoTask(task) || !seconds || seconds <= 0) {
    return "";
  }

  return `${seconds}s`;
}

function getDownloadName(task: HistoryMediaTask & { taskNo: string }, index: number) {
  let extension = task.format || "png";
  if (isVideoTask(task)) {
    extension = "mp4";
  }

  return `zroimg-${task.taskNo}-${index + 1}.${extension}`;
}

function getDeleteText(task: Pick<HistoryMediaTask, "modelType">) {
  const label = getMediaLabel(task);
  return `删除后${label}将从存储中永久移除，且会同时从画廊和收藏中移除，无法恢复。`;
}

export {
  getDeleteText,
  getDownloadName,
  getDurationText,
  getMediaLabel,
  getResolutionText,
  isVideoTask,
};
