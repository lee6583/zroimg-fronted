import clsx from "clsx";
import Link from "next/link";
import { Clock3, ImageOff } from "lucide-react";
import { AppPagination } from "@/components/ui/app-pagination";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { taskStatusLabels } from "@/features/generation/generation-model";
import { HistoryImageActions } from "@/features/history/history-image-actions";
import { TaskPoller } from "@/features/history/task-poller";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PageResult } from "@/types/api";
import type { FavoriteCollection } from "@/types/favorites";
import type { GenerationResult, GenerationTask, GenerationTaskQuery } from "@/types/generation";
import { getImageResolutionLabel } from "@/utils/generation-quality";
import { userAssetDownloadUrl } from "@/utils/media";
import { HistoryFilters } from "./history-filters";
import styles from "./history.module.css";

export const dynamic = "force-dynamic";

type MediaFilter = "all" | "image" | "video";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type HistoryPageProps = {
  searchParams: SearchParams;
};
type HistoryItem = {
  id: string;
  index: number;
  task: GenerationTask;
  result: GenerationResult | null;
};

const defaultPageSize = 10;
const pageSizes = [10, 20, 50];
const emptyPage: PageResult<GenerationTask> = { total: 0, pages: 0, list: [] };

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizePage(value?: string) {
  const page = Number(value || 1);
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.floor(page));
}

function normalizePageSize(value?: string) {
  const size = Number(value || defaultPageSize);
  if (!Number.isFinite(size)) {
    return defaultPageSize;
  }

  if (pageSizes.includes(size)) {
    return size;
  }

  return defaultPageSize;
}

function normalizeMedia(value?: string): MediaFilter {
  if (value === "image") {
    return "image";
  }

  if (value === "video") {
    return "video";
  }

  return "all";
}

function normalizeTimeText(value: string | undefined, mode: "start" | "end") {
  if (!value) {
    return "";
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  if (dateOnly && mode === "start") {
    return `${value}T00:00`;
  }

  if (dateOnly && mode === "end") {
    return `${value}T23:59`;
  }

  const dateWithTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value);
  if (dateWithTime) {
    return value;
  }

  return "";
}

function getTimeRange(from: string, to: string) {
  if (from && to && from > to) {
    return {};
  }

  return {
    beginTime: from ? `${from}:00` : undefined,
    endTime: to ? `${to}:59` : undefined,
  };
}

function formatTime(value: string) {
  return value.replace("T", " ").slice(0, 19);
}

function getUnitPoints(task: GenerationTask) {
  if (task.unitPoints !== null) {
    return task.unitPoints;
  }

  return Math.round(task.requiredPoints / Math.max(task.count, 1));
}

function toHistoryItems(tasks: GenerationTask[]) {
  const items: HistoryItem[] = [];

  for (const task of tasks) {
    const results = task.results ?? [];
    if (results.length === 0) {
      items.push({ id: task.id, index: 0, task, result: null });
      continue;
    }

    results.forEach((result, index) => {
      items.push({ id: result.id, index, task, result });
    });
  }

  return items;
}

export default async function HistoryPage(props: HistoryPageProps) {
  const searchParams = props.searchParams;
  const params = await searchParams;
  const from = normalizeTimeText(readParam(params, "from"), "start");
  const to = normalizeTimeText(readParam(params, "to"), "end");
  const media = normalizeMedia(readParam(params, "media"));
  const rawPage = normalizePage(readParam(params, "page"));
  const currentPageSize = normalizePageSize(readParam(params, "pageSize"));
  const range = getTimeRange(from, to);
  const shouldShowImages = media === "all" || media === "image";

  await requireUser();
  let tasksPromise = Promise.resolve(emptyPage);
  if (shouldShowImages) {
    const query: GenerationTaskQuery = {
      ...range,
      pageNo: rawPage,
      pageSize: currentPageSize,
      modelType: "image",
    };
    tasksPromise = requestJava<PageResult<GenerationTask>>("/generation/user/tasks", {
      params: query,
    });
  }
  const [taskPage, collections] = await Promise.all([
    tasksPromise,
    requestJava<FavoriteCollection[]>("/favorite/user/collections"),
  ]);
  const historyItems = toHistoryItems(taskPage.list);
  const total = taskPage.total;
  const currentPage = rawPage;

  const hasDateFilter = Boolean(from || to);
  const hasMediaFilter = media !== "all";
  const activeFilter = hasDateFilter || hasMediaFilter;
  let emptyTitle = "还没有创作记录";
  let emptyText = "写下第一句提示词，让灵感在这里留下第一张图。";
  let emptyHref = "/generate";
  let emptyAction = "去创作";

  if (activeFilter) {
    emptyTitle = "当前筛选条件下没有创作记录";
    emptyText = "可以调整时间或类型筛选，或者查看全部历史。";
    emptyHref = "/history";
    emptyAction = "查看全部";
  }

  if (media === "video") {
    emptyTitle = "还没有视频创作记录";
    emptyText = "视频历史数据源还没有接入，后端完成后会在这里展示。";
    emptyHref = "/video";
    emptyAction = "去创作视频";
  }

  return (
    <main className={styles.history}>
      <section className={styles.history__header}>
        <h1 className="page-title">创作历史</h1>
      </section>

      <section className={styles.history__toolbar} aria-label="创作历史筛选">
        <HistoryFilters from={from} to={to} media={media} />
      </section>

      {historyItems.length > 0 ? (
        <>
          <section className={styles.history__tableCard} aria-label="历史作品">
            <div className={styles.history__tableScroller}>
              <div className={clsx(styles.history__tableRow, styles.history__tableHead)}>
                <span className={styles.history__centerCell}>图片</span>
                <span className={styles.history__centerCell}>提示词</span>
                <span className={styles.history__centerCell}>模型</span>
                <span className={styles.history__centerCell}>分辨率</span>
                <span className={styles.history__centerCell}>比例</span>
                <span className={styles.history__centerCell}>消耗</span>
                <span className={styles.history__centerCell}>状态</span>
                <span className={styles.history__centerCell}>时间</span>
                <span className={styles.history__centerCell}>操作</span>
              </div>

              <div className={styles.history__tableBody}>
                {historyItems.map((item) => {
                  const task = item.task;
                  const result = item.result;
                  const extension = task.format || "png";
                  const fileName = `zroimg-${task.taskNo}-${item.index + 1}.${extension}`;

                  return (
                    <article key={item.id} className={styles.history__tableRow}>
                      <div className={styles.history__preview}>
                        {result ? (
                          <ImageLightbox
                            src={result.resultUrl}
                            alt={task.prompt}
                            width={768}
                            height={768}
                            imageClassName={styles.history__image}
                          />
                        ) : (
                          <div className={styles.history__placeholder}>
                            <ImageOff size={18} />
                          </div>
                        )}
                      </div>

                      <div className={styles.history__promptCell}>
                        <h2 className={styles.history__prompt}>{task.prompt}</h2>
                        {task.failReason ? (
                          <p className={styles.history__error}>{task.failReason}</p>
                        ) : null}
                      </div>

                      <p className={clsx(styles.history__cellText, styles.history__centerCell)}>
                        {task.modelName || task.modelCode}
                      </p>
                      <p className={clsx(styles.history__cellText, styles.history__centerCell)}>
                        {getImageResolutionLabel(task.quality ?? "-")}
                      </p>
                      <p className={clsx(styles.history__cellText, styles.history__centerCell)}>
                        {task.ratio || "-"}
                      </p>
                      <p className={clsx(styles.history__credits, styles.history__centerCell)}>
                        {getUnitPoints(task)}
                      </p>
                      <span
                        className={clsx(
                          styles.history__status,
                          styles.history__centerCell,
                          task.status === "succeeded" && styles.history__statusSuccess,
                          task.status === "failed" && styles.history__statusDanger,
                        )}
                      >
                        {taskStatusLabels[task.status]}
                      </span>
                      <p className={clsx(styles.history__cellText, styles.history__centerCell)}>
                        {formatTime(task.createTime)}
                      </p>

                      <div className={styles.history__actions}>
                        {result ? (
                          <HistoryImageActions
                            generatedImageId={result.id}
                            galleryStatus={result.galleryStatus}
                            galleryReason={result.galleryRejectReason}
                            collections={collections}
                            downloadUrl={userAssetDownloadUrl(result.mediaAssetId)}
                            downloadFileName={fileName}
                          />
                        ) : (
                          <TaskPoller taskNo={task.taskNo} initialStatus={task.status} />
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <AppPagination current={currentPage} pageSize={currentPageSize} total={total} />
        </>
      ) : (
        <section className={styles.history__empty}>
          <span className={styles.history__emptyIcon}>
            <Clock3 size={30} />
          </span>
          <h2 className={styles.history__emptyTitle}>{emptyTitle}</h2>
          <p className={styles.history__emptyText}>{emptyText}</p>
          <Link href={emptyHref} className={styles.history__emptyAction}>
            {emptyAction}
          </Link>
        </section>
      )}
    </main>
  );
}
