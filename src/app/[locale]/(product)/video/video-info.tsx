"use client";

import clsx from "clsx";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useFormatter } from "next-intl";
import { useState } from "react";
import type { VideoTask } from "@/types/video";
import { parseJavaDateTime } from "@/utils/java-time";
import { useVideoText } from "./video-text";
import styles from "./video.module.css";

type VideoInfoProps = {
  task: VideoTask;
  actions?: ReactNode;
};

const longPrompt = 120;

export function VideoInfo(props: VideoInfoProps) {
  const task = props.task;
  const text = useVideoText();
  const t = text.t;
  const format = useFormatter();
  const [isOpen, setOpen] = useState(false);
  const [isPromptOpen, setPromptOpen] = useState(false);
  const canExpand = task.prompt.length > longPrompt || task.prompt.includes("\n");
  let duration = "-";
  if (task.durationSeconds !== null) {
    duration = t("seconds", { seconds: task.durationSeconds });
  }
  let createdAt = "-";
  if (task.createTime) {
    createdAt = format.dateTime(parseJavaDateTime(task.createTime), "datetime");
  }
  const rows = [
    { key: "model", label: t("info.model"), value: task.modelName || task.modelCode },
    { key: "mode", label: t("info.mode"), value: text.modeLabel(task.mode) },
    { key: "duration", label: t("info.duration"), value: duration },
    { key: "ratio", label: t("info.ratio"), value: task.ratio || "-" },
    { key: "resolution", label: t("info.resolution"), value: task.resolution || "-" },
    { key: "points", label: t("info.points"), value: format.number(task.requiredPoints, "points") },
    { key: "createdAt", label: t("info.createdAt"), value: createdAt },
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
          {t("info.toggle")}
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
                {isPromptOpen ? t("info.collapse") : t("info.expand")}
              </button>
            ) : null}
          </div>
          <dl className={styles.videoPage__infoGrid}>
            {rows.map((row) => (
              <div key={row.key} className={styles.videoPage__infoItem}>
                <dt>{row.label}</dt>
                <dd title={row.value}>{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </section>
  );
}
