"use client";

import clsx from "clsx";
import { CircleAlert, RotateCcw } from "lucide-react";
import type { CSSProperties, TransitionEvent } from "react";
import { useState } from "react";
import { useClock } from "@/features/generation/use-clock";
import type { VideoTask } from "@/types/video";
import { getRetryLabel, isTaskRetrying } from "@/utils/task-status";
import {
  formatElapsed,
  getVideoStage,
  isVideoRunning,
  parseJavaTime,
  parseRatio,
  shortFailReason,
  videoStageHints,
  videoStageLabels,
} from "@/utils/video-task";
import styles from "./video-frame.module.css";

type VideoFrameProps = {
  task: VideoTask;
  compact?: boolean;
  isRetrying?: boolean;
  retryMessage?: string;
  onRetry?: () => void;
};

type ElapsedProps = {
  createTime: string;
};

type VideoState = "loading" | "ready" | "error";

export function frameStyle(ratio: string) {
  const size = parseRatio(ratio) ?? { width: 16, height: 9 };
  return {
    "--frame-ratio": `${size.width} / ${size.height}`,
    "--frame-ratio-value": size.width / size.height,
  } as CSSProperties;
}

export function VideoFrame(props: VideoFrameProps) {
  const task = props.task;
  const compact = props.compact ?? false;
  const stage = getVideoStage(task.status, isTaskRetrying(task));
  const isRunning = isVideoRunning(stage);
  const resultUrl = task.results[0]?.resultUrl ?? "";
  const hasVideo = stage === "completed" && Boolean(resultUrl);
  const [videoState, setVideoState] = useState<VideoState>("loading");
  const [isCoverGone, setCoverGone] = useState(false);
  const isReady = hasVideo && videoState === "ready";
  const reason = shortFailReason(task.failReason);
  let title = videoStageLabels[stage];
  if (stage === "retrying") {
    title = getRetryLabel(task);
  }

  function hideCover(event: TransitionEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget && isReady) {
      setCoverGone(true);
    }
  }

  function bindVideo(node: HTMLVideoElement | null) {
    // 水合前已加载完成时 loadeddata 不会再触发
    if (node && node.readyState >= 2) {
      setVideoState("ready");
    }
  }

  return (
    <div
      className={clsx(styles.frame, compact && styles.frameCompact)}
      style={frameStyle(task.ratio)}
      data-stage={stage}
    >
      {hasVideo ? (
        <video
          ref={bindVideo}
          className={clsx(styles.frame__video, isReady && styles.frame__videoReady)}
          src={resultUrl}
          controls={!compact}
          muted={compact}
          playsInline
          preload={compact ? "metadata" : "auto"}
          onLoadedData={() => setVideoState("ready")}
          onError={() => setVideoState("error")}
        />
      ) : null}

      {stage === "failed" ? (
        <div className={clsx(styles.frame__layer, styles.frame__failed)}>
          <CircleAlert size={compact ? 18 : 22} className={styles.frame__failIcon} />
          <p className={styles.frame__title}>{videoStageLabels.failed}</p>
          <p className={styles.frame__reason} title={reason}>
            {reason}
          </p>
          {props.onRetry && !compact ? (
            <button
              type="button"
              className={styles.frame__retry}
              onClick={props.onRetry}
              disabled={props.isRetrying}
            >
              <RotateCcw size={14} />
              {props.isRetrying ? "提交中..." : "重新生成"}
            </button>
          ) : null}
          {props.retryMessage && !compact ? (
            <p className={styles.frame__reason} title={props.retryMessage}>
              {props.retryMessage}
            </p>
          ) : null}
        </div>
      ) : null}

      {stage !== "failed" && !isCoverGone ? (
        <div
          className={clsx(
            styles.frame__layer,
            styles.frame__cover,
            isRunning && styles.frame__coverActive,
            isReady && styles.frame__coverHidden,
          )}
          onTransitionEnd={hideCover}
          aria-hidden={isReady}
        >
          {videoState === "error" ? null : <span className={styles.frame__sweep} />}
          <div className={clsx(styles.frame__content, !isRunning && styles.frame__contentIdle)}>
            {isRunning ? (
              <>
                <span
                  className={clsx(
                    styles.frame__mark,
                    stage === "generating" && styles.frame__markLive,
                  )}
                  aria-hidden
                />
                <p className={styles.frame__title} role="status">
                  {title}
                  <Elapsed createTime={task.createTime} />
                </p>
                {compact ? null : <p className={styles.frame__hint}>{videoStageHints[stage]}</p>}
              </>
            ) : null}
            {!isRunning && videoState === "error" ? (
              <p className={styles.frame__hint}>视频加载失败</p>
            ) : null}
          </div>
          {isRunning && !compact ? (
            <p className={styles.frame__meta}>
              {[task.ratio, task.resolution, durationText(task.durationSeconds)]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function durationText(value: number | null) {
  if (value === null) {
    return "";
  }
  return `${value}s`;
}

function Elapsed(props: ElapsedProps) {
  const now = useClock();
  const start = parseJavaTime(props.createTime);

  if (!now || start === null) {
    return null;
  }

  return (
    <span className={styles.frame__elapsed} aria-hidden>
      {" · "}
      {formatElapsed(now - start)}
    </span>
  );
}
