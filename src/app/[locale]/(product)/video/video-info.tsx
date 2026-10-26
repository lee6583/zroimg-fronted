"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import type { VideoTask } from "@/types/video";
import { formatVideoTime } from "@/utils/video-task";
import { displayMode } from "./video-submit";
import styles from "./video.module.css";

type VideoInfoProps = {
  task: VideoTask;
  actions?: ReactNode;
};

const longPrompt = 120;

export function VideoInfo(props: VideoInfoProps) {
  const task = props.task;
  const [isOpen, setOpen] = useState(false);
  const [isPromptOpen, setPromptOpen] = useState(false);
  const canExpand = task.prompt.length > longPrompt || task.prompt.includes("\n");
  const rows = [
    { label: "模型", value: task.modelName || task.modelCode },
    { label: "模式", value: displayMode(task.mode) },
    { label: "时长", value: task.durationSeconds === null ? "-" : `${task.durationSeconds} 秒` },
    { label: "比例", value: task.ratio || "-" },
    { label: "分辨率", value: task.resolution || "-" },
    { label: "消耗积分", value: String(task.requiredPoints) },
    { label: "创建时间", value: formatVideoTime(task.createTime) },
  ];

  return (
    <section className={styles.videoPage__info}>
      <div className={styles.videoPage__infoBar}>
        <button
          type="button"
          className={styles.videoPage__infoToggle}
          onClick={() => setOpen((value) => !value)}
          aria-expanded={isOpen}
        >
          生成信息
          <ChevronDown
            size={15}
            className={clsx(styles.videoPage__chevron, isOpen && styles.videoPage__chevronOpen)}
          />
        </button>
        {props.actions}
      </div>

      {isOpen ? (
        <div className={styles.videoPage__infoBody}>
          <div className={styles.videoPage__promptBlock}>
            <p
              className={clsx(
                styles.videoPage__prompt,
                !isPromptOpen && styles.videoPage__promptClamp,
              )}
            >
              {task.prompt}
            </p>
            {canExpand ? (
              <button
                type="button"
                className={styles.videoPage__textButton}
                onClick={() => setPromptOpen((value) => !value)}
              >
                {isPromptOpen ? "收起" : "展开"}
              </button>
            ) : null}
          </div>
          <dl className={styles.videoPage__infoGrid}>
            {rows.map((row) => (
              <div key={row.label} className={styles.videoPage__infoItem}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
