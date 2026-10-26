import clsx from "clsx";
import { Clock3, ImageOff } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { AppPagination } from "@/components/ui/app-pagination";
import table from "@/components/ui/data-table.module.css";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { VideoLightbox } from "@/components/ui/video-lightbox";
import { isTaskPending } from "@/features/generation/generation-model";
import { HistoryDeleteButton } from "@/features/history/history-delete-button";
import { HistoryImageActions } from "@/features/history/history-image-actions";
import { HistoryRow, HistoryTable } from "@/features/history/history-table";
import { TaskPoller } from "@/features/history/task-poller";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PageResult } from "@/types/api";
import type { FavoriteCollection } from "@/types/favorites";
import type { GenerationResult, GenerationTask, GenerationTaskQuery } from "@/types/generation";
import {
  getDownloadName,
  getDurationSeconds,
  getMediaKind,
  getResolutionText,
} from "@/utils/history";
import { parseJavaDateTime } from "@/utils/java-time";
import { userAssetDownloadUrl } from "@/utils/media";
import { getTaskStatusLabel, isTaskRetrying } from "@/utils/task-status";
import { HistoryFilters } from "./history-filters";
import styles from "./history.module.css";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("history.meta");
  return { title: t("title") };
}

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

  await requireUser();
  const query: GenerationTaskQuery = {
    ...range,
    pageNo: rawPage,
    pageSize: currentPageSize,
  };
  if (media !== "all") {
    query.modelType = media;
  }
  const [taskPage, collections] = await Promise.all([
    requestJava<PageResult<GenerationTask>>("/generation/user/tasks", { params: query }),
    requestJava<FavoriteCollection[]>("/favorite/user/collections"),
  ]);
  const historyItems = toHistoryItems(taskPage.list);
  const total = taskPage.total;
  const currentPage = rawPage;

  const t = await getTranslations("history");
  const tTask = await getTranslations("task");
  const format = await getFormatter();
  const hasDateFilter = Boolean(from || to);
  const hasMediaFilter = media !== "all";
  const activeFilter = hasDateFilter || hasMediaFilter;
  let emptyKey: "default" | "filtered" | "video" = "default";
  let emptyHref = "/generate";

  if (activeFilter) {
    emptyKey = "filtered";
    emptyHref = "/history";
  }

  if (media === "video") {
    emptyKey = "video";
    emptyHref = "/video";
  }

  function resolutionLabel(task: GenerationTask) {
    const value = getResolutionText(task);
    if (value === "auto" || value === "standard") {
      return tTask(`quality.${value}`);
    }

    return value || "-";
  }

  return (
    <main className={styles.history}>
      <section className={styles.history__header}>
        <h1 className="page-title">{t("title")}</h1>
      </section>

      <section className={styles.history__toolbar} aria-label={t("filters.label")}>
        <HistoryFilters from={from} to={to} media={media} />
      </section>

      {historyItems.length > 0 ? (
        <>
          <HistoryTable>
            <section
              className={clsx(table.dataTable__card, styles.history__list)}
              aria-label={t("list.label")}
            >
              <table className={clsx(table.dataTable, styles.history__table)}>
                <colgroup>
                  <col className={styles.history__colImage} />
                  <col />
                  <col className={styles.history__colModel} />
                  <col className={styles.history__colShort} />
                  <col className={styles.history__colShort} />
                  <col className={styles.history__colShort} />
                  <col className={styles.history__colStatus} />
                  <col className={styles.history__colTime} />
                  <col className={styles.history__colActions} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t("columns.preview")}</th>
                    <th className={table.dataTable__start}>{t("columns.prompt")}</th>
                    <th>{t("columns.model")}</th>
                    <th>{t("columns.resolution")}</th>
                    <th>{t("columns.ratio")}</th>
                    <th>{t("columns.points")}</th>
                    <th>{t("columns.status")}</th>
                    <th>{t("columns.time")}</th>
                    <th>{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map((item) => {
                    const task = item.task;
                    const result = item.result;
                    const kind = getMediaKind(task);
                    const isVideo = kind === "video";
                    const fileName = getDownloadName(task, item.index);
                    const modelName = task.modelName || task.modelCode;
                    const durationSeconds = getDurationSeconds(task);
                    const duration =
                      durationSeconds === null ? "" : t("duration", { seconds: durationSeconds });
                    const resolution = resolutionLabel(task);
                    const time = format.dateTime(parseJavaDateTime(task.createTime), "datetime");
                    const metaLine = [modelName, resolution, duration, time]
                      .filter((value) => value && value !== "-")
                      .join(" · ");

                    return (
                      <HistoryRow
                        key={item.id}
                        taskNo={task.taskNo}
                        className={styles.history__row}
                      >
                        <td className={styles.history__cellPreview}>
                          <div className={styles.history__preview}>
                            {result && isVideo ? (
                              <VideoLightbox src={result.resultUrl} label={task.prompt} />
                            ) : null}
                            {result && !isVideo ? (
                              <ImageLightbox
                                src={result.resultUrl}
                                alt={task.prompt}
                                width={768}
                                height={768}
                                imageClassName={styles.history__image}
                              />
                            ) : null}
                            {result ? null : (
                              <div className={styles.history__placeholder}>
                                <ImageOff size={18} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className={clsx(table.dataTable__start, styles.history__cellPrompt)}>
                          <h2
                            className={clsx(table.dataTable__ellipsis, styles.history__prompt)}
                            title={task.prompt}
                          >
                            {task.prompt}
                          </h2>
                          {task.failReason ? (
                            <p
                              className={clsx(table.dataTable__ellipsis, styles.history__error)}
                              title={task.failReason}
                            >
                              {task.failReason}
                            </p>
                          ) : null}
                        </td>
                        <td className={styles.history__cellMeta}>
                          <span className={styles.history__metaLine} title={metaLine}>
                            {metaLine}
                          </span>
                        </td>
                        <td className={clsx(table.dataTable__muted, styles.history__cellDesktop)}>
                          <span className={table.dataTable__ellipsis} title={modelName}>
                            {modelName}
                          </span>
                        </td>
                        <td className={clsx(table.dataTable__muted, styles.history__cellDesktop)}>
                          <span className={table.dataTable__ellipsis}>{resolution}</span>
                          {duration ? (
                            <span
                              className={clsx(table.dataTable__ellipsis, styles.history__duration)}
                            >
                              {duration}
                            </span>
                          ) : null}
                        </td>
                        <td className={clsx(table.dataTable__muted, styles.history__cellDesktop)}>
                          {task.ratio || "-"}
                        </td>
                        <td className={clsx(table.dataTable__num, styles.history__cellDesktop)}>
                          {getUnitPoints(task)}
                        </td>
                        <td className={styles.history__cellStatus}>
                          <span
                            className={clsx(
                              styles.history__status,
                              task.status === "succeeded" && styles.history__statusSuccess,
                              task.status === "failed" && styles.history__statusDanger,
                              isTaskRetrying(task) && styles.history__statusWarning,
                            )}
                          >
                            {getTaskStatusLabel(task, tTask)}
                          </span>
                        </td>
                        <td className={clsx(table.dataTable__time, styles.history__cellDesktop)}>
                          {time}
                        </td>
                        <td className={styles.history__cellActions}>
                          <div className={clsx(table.dataTable__actions, styles.history__actions)}>
                            {result ? (
                              <HistoryImageActions
                                generatedImageId={result.id}
                                galleryStatus={result.galleryStatus}
                                galleryReason={result.galleryRejectReason}
                                collections={collections}
                                downloadUrl={userAssetDownloadUrl(result.mediaAssetId)}
                                downloadFileName={fileName}
                                media={kind}
                                size="touch"
                              />
                            ) : null}
                            {result ? null : (
                              <TaskPoller
                                taskNo={task.taskNo}
                                initialTask={{
                                  status: task.status,
                                  attemptCount: task.attemptCount,
                                  maxAttempts: task.maxAttempts,
                                  retrying: task.retrying,
                                  nextAttemptTime: task.nextAttemptTime,
                                }}
                              />
                            )}
                            <HistoryDeleteButton
                              taskNo={task.taskNo}
                              media={kind}
                              isRunning={isTaskPending(task)}
                              size="touch"
                            />
                          </div>
                        </td>
                      </HistoryRow>
                    );
                  })}
                </tbody>
              </table>
            </section>
          </HistoryTable>

          <AppPagination current={currentPage} pageSize={currentPageSize} total={total} />
        </>
      ) : (
        <section className={styles.history__empty}>
          <span className={styles.history__emptyIcon}>
            <Clock3 size={30} />
          </span>
          <h2 className={styles.history__emptyTitle}>{t(`empty.${emptyKey}.title`)}</h2>
          <p className={styles.history__emptyText}>{t(`empty.${emptyKey}.text`)}</p>
          <Link href={emptyHref} className={styles.history__emptyAction}>
            {t(`empty.${emptyKey}.action`)}
          </Link>
        </section>
      )}
    </main>
  );
}
