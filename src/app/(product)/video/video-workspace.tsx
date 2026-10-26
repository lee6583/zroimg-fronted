"use client";

import clsx from "clsx";
import { Download, Film, PanelLeftClose } from "lucide-react";
import { useEffect, useState } from "react";
import { videoApi } from "@/api/video";
import type { VideoModel, VideoTask, VideoTaskPage, VideoTaskStatus } from "@/types/video";
import { getErrorMessage } from "@/utils/error";
import { userAssetDownloadUrl } from "@/utils/media";
import { formatVideoTime } from "@/utils/video-task";
import { frameStyle, VideoFrame } from "./video-frame";
import { VideoInfo } from "./video-info";
import { VideoSettings } from "./video-settings";
import { retryInput, submitVideoTask } from "./video-submit";
import styles from "./video.module.css";

const pageSize = 20;

type RetryState = {
  taskNo: string;
  message: string;
};

type DownloadLinkProps = {
  task: VideoTask;
};

type VideoWorkspaceProps = {
  initialModels: VideoModel[];
  initialPage: VideoTaskPage;
};

function isTaskRunning(status: VideoTaskStatus) {
  return status === "pending" || status === "processing";
}

function listTaskPage(pageNo: number) {
  return videoApi.listTasks({ pageNo, pageSize, isAsc: false, sortBy: "create_time" });
}

function getDownloadUrl(task: VideoTask) {
  const result = task.results[0];
  if (!result) {
    return null;
  }
  if (result.mediaAssetId) {
    return userAssetDownloadUrl(result.mediaAssetId);
  }
  return result.resultUrl;
}

function replaceTasks(tasks: VideoTask[], nextTask: VideoTask) {
  return tasks.map((task) => {
    if (task.taskNo === nextTask.taskNo) {
      return nextTask;
    }
    return task;
  });
}

export function VideoWorkspace(props: VideoWorkspaceProps) {
  const [isSettingsOpen, setSettingsOpen] = useState(true);
  const [tasks, setTasks] = useState(props.initialPage.list);
  const [pageNo, setPageNo] = useState(1);
  const [totalPages, setTotalPages] = useState(props.initialPage.pages);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [selectedNo, setSelectedNo] = useState<string | null>(null);
  const [retry, setRetry] = useState<RetryState | null>(null);
  const [retryingNo, setRetryingNo] = useState<string | null>(null);

  const selected = tasks.find((task) => task.taskNo === selectedNo) ?? tasks[0] ?? null;
  const hasPendingTask = tasks.some((task) => isTaskRunning(task.status));

  useEffect(() => {
    if (!hasPendingTask) {
      return;
    }

    let isActive = true;
    const timer = window.setInterval(async () => {
      const pendingTasks = tasks.filter((task) => isTaskRunning(task.status));

      for (const task of pendingTasks) {
        try {
          const nextTask = await videoApi.getTask(task.taskNo);
          if (!isActive) {
            return;
          }
          setTasks((currentTasks) => replaceTasks(currentTasks, nextTask));
        } catch {
          continue;
        }
      }
    }, 5000);

    return () => {
      isActive = false;
      window.clearInterval(timer);
    };
  }, [hasPendingTask, tasks]);

  async function refreshTasks() {
    const page = await listTaskPage(1);
    setTasks(page.list);
    setPageNo(1);
    setTotalPages(page.pages);
    setSelectedNo(null);
  }

  async function retryTask(task: VideoTask) {
    const input = retryInput(task);
    if (!input) {
      setRetry({ taskNo: task.taskNo, message: "任务参数不完整，请在左侧重新提交" });
      return;
    }

    try {
      setRetryingNo(task.taskNo);
      setRetry(null);
      await submitVideoTask(input);
      await refreshTasks();
    } catch (error) {
      setRetry({ taskNo: task.taskNo, message: getErrorMessage(error) });
    } finally {
      setRetryingNo(null);
    }
  }

  async function loadMore() {
    if (isLoadingMore || pageNo >= totalPages) {
      return;
    }

    try {
      setLoadingMore(true);
      const page = await listTaskPage(pageNo + 1);
      setTasks((currentTasks) => {
        const taskMap = new Map(currentTasks.map((task) => [task.taskNo, task]));
        for (const task of page.list) {
          taskMap.set(task.taskNo, task);
        }
        return Array.from(taskMap.values());
      });
      setPageNo((currentPage) => currentPage + 1);
      setTotalPages(page.pages);
    } finally {
      setLoadingMore(false);
    }
  }

  let content = (
    <div className={styles.videoPage__empty}>
      <span className={styles.videoPage__emptyIcon}>
        <Film size={30} />
      </span>
      <h2 className={styles.videoPage__emptyTitle}>视频创作暂未开放</h2>
      <p className={styles.videoPage__emptyText}>管理员配置视频服务后，这里会显示可用模型。</p>
    </div>
  );
  if (props.initialModels.length > 0 && !selected) {
    content = (
      <div className={styles.videoPage__empty}>
        <span className={styles.videoPage__emptyIcon}>
          <Film size={30} />
        </span>
        <h2 className={styles.videoPage__emptyTitle}>还没有视频作品</h2>
      </div>
    );
  }
  if (props.initialModels.length > 0 && selected) {
    content = (
      <>
        <section className={styles.videoPage__stage} style={frameStyle(selected.ratio)}>
          <VideoFrame
            key={selected.taskNo}
            task={selected}
            isRetrying={retryingNo === selected.taskNo}
            retryMessage={retry?.taskNo === selected.taskNo ? retry.message : ""}
            onRetry={() => retryTask(selected)}
          />
          <VideoInfo
            key={selected.taskNo}
            task={selected}
            actions={<DownloadLink task={selected} />}
          />
        </section>

        {tasks.length > 1 ? (
          <section className={styles.videoPage__history}>
            <h2 className={styles.videoPage__historyTitle}>全部作品</h2>
            <div className={styles.videoPage__taskList}>
              {tasks.map((task) => (
                <button
                  key={task.taskNo}
                  type="button"
                  className={clsx(
                    styles.videoPage__task,
                    task.taskNo === selected.taskNo && styles.videoPage__taskActive,
                  )}
                  onClick={() => setSelectedNo(task.taskNo)}
                  aria-pressed={task.taskNo === selected.taskNo}
                >
                  <VideoFrame task={task} compact />
                  <span className={styles.videoPage__taskMeta}>
                    {formatVideoTime(task.createTime)} · {task.ratio}
                  </span>
                </button>
              ))}
            </div>
            {pageNo < totalPages ? (
              <button
                type="button"
                className={styles.videoPage__loadMore}
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "加载中..." : "加载更多"}
              </button>
            ) : null}
          </section>
        ) : null}
      </>
    );
  }

  return (
    <main className={clsx(styles.videoPage, !isSettingsOpen && styles.videoPageCollapsed)}>
      {isSettingsOpen ? (
        <VideoSettings models={props.initialModels} onCreated={refreshTasks} />
      ) : null}

      <section className={styles.videoPage__workspace}>
        <div className={styles.videoPage__toolbar}>
          <button
            type="button"
            onClick={() => setSettingsOpen((isOpen) => !isOpen)}
            className={styles.videoPage__collapseButton}
            aria-label={isSettingsOpen ? "收起视频设置" : "展开视频设置"}
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <section className={styles.videoPage__content}>{content}</section>
      </section>
    </main>
  );
}

function DownloadLink(props: DownloadLinkProps) {
  const task = props.task;
  const url = getDownloadUrl(task);
  if (!url || task.status !== "succeeded") {
    return null;
  }

  return (
    <a href={url} download className={styles.videoPage__download} aria-label="下载视频">
      <Download size={15} />
      下载
    </a>
  );
}
