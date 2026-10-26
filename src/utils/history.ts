type HistoryMediaTask = {
  modelType: string;
  quality: string | null;
  resolution: string | null;
  durationSeconds: number | null;
  format: string | null;
};

type HistoryMedia = "image" | "video";

// 图片画质 -> 分辨率档位；auto / standard 等无档位的值由页面按 history.quality.* 翻译
const imageResolutionLabels: Record<string, string> = {
  low: "1K",
  medium: "2K",
  high: "4K",
};

function isVideoTask(task: Pick<HistoryMediaTask, "modelType">) {
  return task.modelType === "video";
}

function getMediaKind(task: Pick<HistoryMediaTask, "modelType">): HistoryMedia {
  if (isVideoTask(task)) {
    return "video";
  }

  return "image";
}

/** 视频返回分辨率（720p），图片返回 1K/2K/4K；其余画质原样返回，没有值时返回空字符串。 */
function getResolutionText(task: HistoryMediaTask) {
  if (isVideoTask(task)) {
    return task.resolution || "";
  }

  const quality = task.quality ?? "";
  return imageResolutionLabels[quality] ?? quality;
}

function getDurationSeconds(task: HistoryMediaTask) {
  const seconds = task.durationSeconds;
  if (!isVideoTask(task) || !seconds || seconds <= 0) {
    return null;
  }

  return seconds;
}

function getDownloadName(task: HistoryMediaTask & { taskNo: string }, index: number) {
  let extension = task.format || "png";
  if (isVideoTask(task)) {
    extension = "mp4";
  }

  return `zroimg-${task.taskNo}-${index + 1}.${extension}`;
}

export type { HistoryMedia };
export { getDownloadName, getDurationSeconds, getMediaKind, getResolutionText, isVideoTask };
