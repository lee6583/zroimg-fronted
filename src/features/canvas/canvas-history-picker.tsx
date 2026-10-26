"use client";

import clsx from "clsx";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { generationTasksApi } from "@/api/generation/tasks";
import { Sheet } from "@/components/ui/sheet";
import { translateApiError } from "@/i18n/api-error";
import type { GenerationResult, GenerationTask } from "@/types/generation";
import { userAssetUrl } from "@/utils/media";
import styles from "./canvas-editor.module.css";

type PickedImage = {
  task: GenerationTask;
  result: GenerationResult;
};

type CanvasHistoryPickerProps = {
  open: boolean;
  onCancel: () => void;
  onConfirm: (images: PickedImage[]) => void;
};

const pageSize = 12;

export function CanvasHistoryPicker(props: CanvasHistoryPickerProps) {
  if (!props.open) return null;

  return <HistoryPicker onCancel={props.onCancel} onConfirm={props.onConfirm} />;
}

function HistoryPicker(props: Omit<CanvasHistoryPickerProps, "open">) {
  const onCancel = props.onCancel;
  const onConfirm = props.onConfirm;
  const t = useTranslations("canvas.history");
  const tError = useTranslations("errors.api");

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
        if (isCurrent) setError(translateApiError(loadError, tError));
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    void load();
    return () => {
      isCurrent = false;
    };
  }, [page, tError]);

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

  const footer = (
    <div className={styles.picker__footer}>
      <div className={styles.picker__pages}>
        <button
          type="button"
          aria-label={t("previous")}
          title={t("previous")}
          className={styles.iconButton}
          disabled={page <= 1 || isLoading}
          onClick={() => changePage(page - 1)}
        >
          <ChevronLeft size={16} />
        </button>
        <span>{t("page", { page, pages: Math.max(pages, 1) })}</span>
        <button
          type="button"
          aria-label={t("next")}
          title={t("next")}
          className={styles.iconButton}
          disabled={page >= pages || isLoading}
          onClick={() => changePage(page + 1)}
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <button
        type="button"
        className={clsx(styles.primaryButton, styles.picker__confirm)}
        disabled={picked.length === 0}
        onClick={() => onConfirm(picked)}
      >
        {picked.length > 0 ? t("addCount", { count: picked.length }) : t("add")}
      </button>
    </div>
  );

  return (
    <Sheet
      open
      onClose={onCancel}
      title={t("title")}
      footer={footer}
      className={styles.pickerSheet}
    >
      {error ? <p className={styles.textDanger}>{error}</p> : null}
      {isLoading ? (
        <div className={styles.dialog__loading}>
          <LoaderCircle size={18} className={styles.spin} />
        </div>
      ) : null}
      {!isLoading && !error && images.length === 0 ? (
        <p className={styles.dialog__empty}>{t("empty")}</p>
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
                aria-pressed={isPicked}
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
    </Sheet>
  );
}

export type { PickedImage };
