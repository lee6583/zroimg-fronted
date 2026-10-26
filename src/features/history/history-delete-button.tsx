"use client";

import clsx from "clsx";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { generationTasksApi } from "@/api/generation/tasks";
import { ConfirmSheet } from "@/features/history/confirm-sheet";
import { useHistoryTable } from "@/features/history/history-table";
import { translateApiError } from "@/i18n/api-error";
import type { HistoryMedia } from "@/utils/history";
import styles from "./history-delete-button.module.css";

type HistoryDeleteButtonProps = {
  taskNo: string;
  media: HistoryMedia;
  isRunning: boolean;
  size?: "compact" | "touch";
};

export function HistoryDeleteButton(props: HistoryDeleteButtonProps) {
  const taskNo = props.taskNo;
  const isRunning = props.isRunning;

  const t = useTranslations("history.delete");
  const tError = useTranslations("errors.api");
  const table = useHistoryTable();
  const [isOpen, setOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);

  let title = t("title");
  if (isRunning) {
    title = t("running");
  }

  async function confirm() {
    setLoading(true);

    try {
      await generationTasksApi.deleteTask(taskNo);
    } catch (error) {
      table.notice.error(translateApiError(error, tError));
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    table.remove(taskNo);
  }

  return (
    <span
      className={clsx(styles.historyDelete, props.size === "touch" && styles.historyDeleteTouch)}
      title={title}
    >
      <button
        type="button"
        aria-label={title}
        disabled={isRunning}
        onClick={() => setOpen(true)}
        className={styles.historyDelete__button}
      >
        <Trash2 size={13} />
      </button>

      <ConfirmSheet
        open={isOpen}
        title={t("title")}
        confirmLabel={isLoading ? t("deleting") : t("confirm")}
        cancelLabel={t("cancel")}
        isDanger
        isLoading={isLoading}
        onConfirm={confirm}
        onClose={() => setOpen(false)}
      >
        {t("content", { media: props.media })}
      </ConfirmSheet>
    </span>
  );
}
