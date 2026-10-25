"use client";

import { useEffect, useState } from "react";
import { generationTasksApi } from "@/api/generation/tasks";
import { isTaskPending, taskStatusLabels } from "@/features/generation/generation-model";
import type { GenerationTaskStatus } from "@/types/generation";
import styles from "./task-poller.module.css";

type TaskPollerProps = {
  taskNo: string;
  initialStatus: GenerationTaskStatus;
};

export function TaskPoller(props: TaskPollerProps) {
  const taskNo = props.taskNo;
  const initialStatus = props.initialStatus;

  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (!isTaskPending({ status })) return;

    const timer = window.setInterval(async () => {
      try {
        const task = await generationTasksApi.fetchTask(taskNo);
        setStatus(task.status);
        if (!isTaskPending(task)) {
          window.location.reload();
        }
      } catch {
        return;
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [status, taskNo]);

  return <span className={styles.taskPoller__badge}>{taskStatusLabels[status]}</span>;
}
