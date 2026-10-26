"use client";

import { Modal } from "antd";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { generationTasksApi } from "@/api/generation/tasks";
import { useHistoryTable } from "@/features/history/history-table";
import { getErrorMessage } from "@/utils/error";
import styles from "./history-delete-button.module.css";

type HistoryDeleteButtonProps = {
  taskNo: string;
  content: string;
  isRunning: boolean;
};

export function HistoryDeleteButton(props: HistoryDeleteButtonProps) {
  const taskNo = props.taskNo;
  const content = props.content;
  const isRunning = props.isRunning;

  const table = useHistoryTable();
  const [isOpen, setOpen] = useState(false);
  const [isLoading, setLoading] = useState(false);

  let title = "删除作品";
  if (isRunning) {
    title = "任务进行中，暂不能删除";
  }

  async function confirm() {
    setLoading(true);

    try {
      await generationTasksApi.deleteTask(taskNo);
    } catch (error) {
      table.notice.error(getErrorMessage(error));
      setLoading(false);
      return;
    }

    setLoading(false);
    setOpen(false);
    table.remove(taskNo);
  }

  return (
    <span className={styles.historyDelete} title={title}>
      <button
        type="button"
        aria-label="删除作品"
        disabled={isRunning}
        onClick={() => setOpen(true)}
        className={styles.historyDelete__button}
      >
        <Trash2 size={13} />
      </button>

      <Modal
        open={isOpen}
        title="删除作品"
        okText="删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        confirmLoading={isLoading}
        mask={{ closable: !isLoading }}
        closable={!isLoading}
        cancelButtonProps={{ disabled: isLoading }}
        width={400}
        classNames={{ container: styles.historyDelete__modal }}
        centered
        onOk={confirm}
        onCancel={() => setOpen(false)}
      >
        <p className={styles.historyDelete__text}>{content}</p>
      </Modal>
    </span>
  );
}
