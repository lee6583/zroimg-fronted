"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { generationTasksApi } from "@/api/generation/tasks";
import type { GenerationResult, GenerationTask } from "@/types/generation";
import { getErrorMessage } from "@/utils/error";
import { userAssetUrl } from "@/utils/media";
import styles from "./canvas-editor.module.css";

type PickedImage = {
  task: GenerationTask;
  result: GenerationResult;
};

type CanvasHistoryPickerProps = {
  onCancel: () => void;
  onConfirm: (images: PickedImage[]) => void;
};

const pageSize = 12;

export function CanvasHistoryPicker(props: CanvasHistoryPickerProps) {
  const onCancel = props.onCancel;
  const onConfirm = props.onConfirm;

  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [picked, setPicked] = useState<PickedImage[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function load() {
      try {
        const result = await generationTasksApi.fetchTasks({
          pageNo: page,
          pageSize,
          status: "succeeded",
          modelType: "image",
        });
        if (!isCurrent) return;

        setTasks(result.list);
        setPages(result.pages);
        setError("");
      } catch (loadError) {
        if (isCurrent) setError(getErrorMessage(loadError));
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    void load();
    return () => {
      isCurrent = false;
    };
  }, [page]);

  useEffect(() => {
    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    document.addEventListener("keydown", closeByEscape);
    return () => document.removeEventListener("keydown", closeByEscape);
  }, [onCancel]);

  function changePage(nextPage: number) {
    setLoading(true);
    setPage(nextPage);
  }

  function toggle(task: GenerationTask, result: GenerationResult) {
    setPicked((current) => {
      const isPicked = current.some((item) => item.result.id === result.id);
      if (isPicked) {
        return current.filter((item) => item.result.id !== result.id);
      }

      return [...current, { task, result }];
    });
  }

  // 第一步：把任务展开为单张结果图。
  const images: PickedImage[] = [];
  for (const task of tasks) {
    for (const result of task.results ?? []) {
      images.push({ task, result });
    }
  }

  return (
    <div className={styles.dialogBackdrop} role="presentation" onClick={onCancel}>
      <section
        role="dialog"
        aria-modal="true"
        aria-label="从历史添加"
        className={styles.dialog}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.dialog__header}>
          <h2 className={styles.dialog__title}>从历史添加</h2>
          <button type="button" aria-label="关闭" className={styles.iconButton} onClick={onCancel}>
            <X size={16} />
          </button>
        </header>

        {error ? <p className={styles.textDanger}>{error}</p> : null}
        {isLoading ? (
          <div className={styles.dialog__loading}>
            <LoaderCircle size={18} className={styles.spin} />
          </div>
        ) : null}
        {!isLoading && !error && images.length === 0 ? (
          <p className={styles.dialog__empty}>暂无已完成的图片</p>
        ) : null}
        {!isLoading && images.length > 0 ? (
          <div className={styles.picker__grid}>
            {images.map((image) => {
              const isPicked = picked.some((item) => item.result.id === image.result.id);

              return (
                <button
                  key={image.result.id}
                  type="button"
                  title={image.task.prompt}
                  className={clsx(styles.picker__item, isPicked && styles.picker__itemActive)}
                  onClick={() => toggle(image.task, image.result)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className={styles.picker__image}
                    src={userAssetUrl(image.result.mediaAssetId)}
                    alt={image.task.prompt}
                    loading="lazy"
                  />
                </button>
              );
            })}
          </div>
        ) : null}

        <footer className={styles.dialog__footer}>
          <div className={styles.picker__pages}>
            <button
              type="button"
              aria-label="上一页"
              className={styles.iconButton}
              disabled={page <= 1 || isLoading}
              onClick={() => changePage(page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <span>
              {page} / {Math.max(pages, 1)}
            </span>
            <button
              type="button"
              aria-label="下一页"
              className={styles.iconButton}
              disabled={page >= pages || isLoading}
              onClick={() => changePage(page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={picked.length === 0}
            onClick={() => onConfirm(picked)}
          >
            添加{picked.length > 0 ? ` ${picked.length} 张` : ""}
          </button>
        </footer>
      </section>
    </div>
  );
}

export type { PickedImage };
