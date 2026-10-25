"use client";

import clsx from "clsx";
import { Download, Film, PanelLeftClose } from "lucide-react";
import { useEffect, useState } from "react";
import { videoApi } from "@/api/video";
import type { VideoModel, VideoTask, VideoTaskPage, VideoTaskStatus } from "@/types/video";
import { userAssetDownloadUrl } from "@/utils/media";
import { VideoSettings } from "./video-settings";
import styles from "./video.module.css";

const pageSize = 20;

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

function statusText(status: VideoTaskStatus) {
  if (status === "pending") return "排队中";
  if (status === "processing") return "生成中";
  if (status === "succeeded") return "已完成";
  if (status === "failed") return "生成失败";
  return status;
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

  const hasPendingTask = tasks.some((task) => isTaskRunning(task.status));

  useEffect(() => {
    if (!hasPendingTask) {
      return;
    }

    const timer = window.setInterval(async () => {
      const pendingTasks = tasks.filter((task) => isTaskRunning(task.status));

      for (const task of pendingTasks) {
        try {
          const nextTask = await videoApi.getTask(task.taskNo);
          setTasks((currentTasks) => replaceTasks(currentTasks, nextTask));
        } catch {
          continue;
        }
      }
    }, 5000);

    return () => window.clearInterval(timer);
  }, [hasPendingTask, tasks]);

  async function refreshTasks() {
    const page = await listTaskPage(1);
    setTasks(page.list);
    setPageNo(1);
    setTotalPages(page.pages);
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

        <section className={styles.videoPage__content}>
          {props.initialModels.length === 0 ? (
            <div className={styles.videoPage__empty}>
              <span className={styles.videoPage__emptyIcon}>
                <Film size={30} />
              </span>
              <h2 className={styles.videoPage__emptyTitle}>视频创作暂未开放</h2>
              <p className={styles.videoPage__emptyText}>
                管理员配置视频服务后，这里会显示可用模型。
              </p>
            </div>
          ) : tasks.length === 0 ? (
            <div className={styles.videoPage__empty}>
              <span className={styles.videoPage__emptyIcon}>
                <Film size={30} />
              </span>
              <h2 className={styles.videoPage__emptyTitle}>还没有视频作品</h2>
            </div>
          ) : (
            <>
              <div className={styles.videoPage__taskList}>
                {tasks.map((task) => {
                  const resultUrl = task.results[0]?.resultUrl;
                  const downloadUrl = getDownloadUrl(task);

                  return (
                    <article key={task.taskNo} className={styles.videoPage__task}>
                      {resultUrl ? (
                        <video controls className={styles.videoPage__player} src={resultUrl} />
                      ) : null}
                      <div className={styles.videoPage__taskInfo}>
                        <div className={styles.videoPage__taskHeader}>
                          <p className={styles.videoPage__taskStatus}>{statusText(task.status)}</p>
                          {downloadUrl ? (
                            <a
                              href={downloadUrl}
                              download
                              className={styles.videoPage__download}
                              aria-label="下载视频"
                            >
                              <Download size={15} />
                              下载
                            </a>
                          ) : null}
                        </div>
                        <p className={styles.videoPage__taskPrompt}>{task.prompt}</p>
                        {task.failReason ? (
                          <p className={styles.videoPage__taskError}>{task.failReason}</p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
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
            </>
          )}
        </section>
      </section>
    </main>
  );
}
