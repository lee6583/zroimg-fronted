"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { generationTasksApi } from "@/api/generation/tasks";
import { isTaskPending } from "@/features/generation/generation-model";
import type { GenerationTask } from "@/types/generation";
import { getTaskStatusLabel } from "@/utils/task-status";
import styles from "./task-poller.module.css";

type PollerTask = Pick<
  GenerationTask,
  "status" | "attemptCount" | "maxAttempts" | "retrying" | "nextAttemptTime"
>;

type TaskPollerProps = {
  taskNo: string;
  initialTask: PollerTask;
};

function pickTask(task: PollerTask): PollerTask {
  return {
    status: task.status,
    attemptCount: task.attemptCount,
    maxAttempts: task.maxAttempts,
    retrying: task.retrying,
    nextAttemptTime: task.nextAttemptTime,
  };
}

export function TaskPoller(props: TaskPollerProps) {
  const taskNo = props.taskNo;

  const tTask = useTranslations("task");
  const [task, setTask] = useState(props.initialTask);
  const status = task.status;

  useEffect(() => {
    if (!isTaskPending({ status })) return;

    const timer = window.setInterval(async () => {
      try {
        const nextTask = await generationTasksApi.fetchTask(taskNo);
        setTask(pickTask(nextTask));
        if (!isTaskPending(nextTask)) {
          window.location.reload();
        }
      } catch {
        return;
      }
    }, 2500);
    return () => window.clearInterval(timer);
  }, [status, taskNo]);

  return <span className={styles.taskPoller__badge}>{getTaskStatusLabel(task, tTask)}</span>;
}
