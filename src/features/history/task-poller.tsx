"use client";

import { useEffect, useState } from "react";
import { generationTasksApi } from "@/api/generation/tasks";
import styles from "./task-poller.module.css";

const statusLabels: Record<string, string> = {
  queued: "排队中",
  running: "生成中",
  succeeded: "已完成",
  failed: "失败",
};

export function TaskPoller({ taskId, initialStatus }: { taskId: string; initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status === "succeeded" || status === "failed") return;
    const timer = window.setInterval(async () => {
      try {
        const data = await generationTasksApi.fetchTask(taskId);
        setStatus(data.task.status);
        if (data.task.status === "succeeded" || data.task.status === "failed") {
          window.location.reload();
        }
      } catch {
        return;
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [status, taskId]);

  return <span className={styles.taskPoller__badge}>{statusLabels[status] ?? status}</span>;
}
