import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { Clock3, ImageOff } from "lucide-react";
import { AppPagination } from "@/components/ui/app-pagination";
import { HistoryImageActions } from "@/features/history/history-image-actions";
import { TaskPoller } from "@/features/history/task-poller";
import { requireUser } from "@/server/auth";
import { listCollections } from "@/server/bff/account";
import { listHistoryTasks } from "@/server/bff/generation";
import { getMediaSignedUrl } from "@/server/bff/generation";
import { HistoryFilters } from "./history-filters";
import styles from "./history.module.css";

export const dynamic = "force-dynamic";

type MediaFilter = "all" | "image" | "video";
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type HistoryPageProps = {
  searchParams: SearchParams;
};
type HistoryTask = Awaited<ReturnType<typeof listHistoryTasks>>[number];
type HistoryOutput = HistoryTask["outputs"][number];
type HistoryItem = {
  id: string;
  task: HistoryTask;
  output: HistoryOutput | null;
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

function dateFromText(value: string, mode: "start" | "end") {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (mode === "end") {
    date.setSeconds(59, 999);
  }

  return date;
}

function getDateRange(fromText: string, toText: string) {
  const from = dateFromText(fromText, "start");
  const to = dateFromText(toText, "end");

  if (from && to && from > to) {
    return {};
  }

  return {
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

function historyHref() {
  return "/history";
}

function getPreviewAsset(output: HistoryOutput | null) {
  if (!output) {
    return null;
  }

  if (output.thumbnailAsset) {
    return output.thumbnailAsset;
  }

  return output.outputAsset;
}

function getPreviewUrl(output: HistoryOutput | null, urls: Map<string, string>) {
  const asset = getPreviewAsset(output);
  if (!asset) {
    return null;
  }

  const url = urls.get(asset.id);
  if (!url) {
    return null;
  }

  return url;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function getStatusLabel(status: HistoryTask["status"]) {
  if (status === "succeeded") {
    return "已完成";
  }

  if (status === "failed") {
    return "失败";
  }

  if (status === "running") {
    return "生成中";
  }

  return "排队中";
}

function toHistoryItems(tasks: HistoryTask[]) {
  const items: HistoryItem[] = [];

  for (const task of tasks) {
    if (task.outputs.length === 0) {
      items.push({ id: task.id, task, output: null });
      continue;
    }

    for (const output of task.outputs) {
      items.push({ id: output.id, task, output });
    }
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
  const range = getDateRange(from, to);
  const shouldShowImages = media === "all" || media === "image";

  const current = await requireUser();
  const tasksPromise = shouldShowImages
    ? listHistoryTasks(current.profile.id, { ...range, sort: "desc" })
    : Promise.resolve([]);
  const [tasks, collections] = await Promise.all([
    tasksPromise,
    listCollections(current.profile.id),
  ]);
  const historyItems = toHistoryItems(tasks);
  const total = historyItems.length;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));
  const currentPage = Math.min(rawPage, totalPages);
  const pageStart = (currentPage - 1) * currentPageSize;
  const pageItems = historyItems.slice(pageStart, pageStart + currentPageSize);

  const assetIds = new Set<string>();
  for (const item of pageItems) {
    if (!item.output) {
      continue;
    }

    const previewAsset = item.output.thumbnailAsset || item.output.outputAsset;
    assetIds.add(previewAsset.id);
    assetIds.add(item.output.outputAsset.id);
  }
  const urlEntries = await Promise.all(
    Array.from(assetIds).map(async (assetId) => {
      const url = await getMediaSignedUrl(assetId);
      return [assetId, url] as const;
    }),
  );
  const urls = new Map(urlEntries);

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
    emptyHref = historyHref();
    emptyAction = "查看全部";
  }

  if (media === "video") {
    emptyTitle = "还没有视频创作记录";
    emptyText = "视频历史数据源还没有接入，后端完成后会在这里展示。";
    emptyHref = "/video";
    emptyAction = "去创作视频";
  }

  const collectionOptions = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    imageCount: collection._count.items,
  }));

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
                <span className={styles.history__centerCell}>消耗</span>
                <span className={styles.history__centerCell}>状态</span>
                <span className={styles.history__centerCell}>时间</span>
                <span className={styles.history__centerCell}>操作</span>
              </div>

              <div className={styles.history__tableBody}>
                {pageItems.map((item) => {
                  const task = item.task;
                  const output = item.output;
                  const asset = getPreviewAsset(output);
                  const url = getPreviewUrl(output, urls);
                  const statusLabel = getStatusLabel(task.status);

                  return (
                    <article key={item.id} className={styles.history__tableRow}>
                      <div className={styles.history__preview}>
                        {url && output && asset ? (
                          <Image
                            className={styles.history__image}
                            src={url}
                            alt={task.prompt}
                            width={output.width || asset.width || 768}
                            height={output.height || asset.height || 768}
                            unoptimized
                          />
                        ) : (
                          <div className={styles.history__placeholder}>
                            <ImageOff size={18} />
                          </div>
                        )}
                      </div>

                      <div className={styles.history__promptCell}>
                        <h2 className={styles.history__prompt}>{task.prompt}</h2>
                        {task.error ? <p className={styles.history__error}>{task.error}</p> : null}
                      </div>

                      <p className={clsx(styles.history__cellText, styles.history__centerCell)}>
                        {task.model}
                      </p>
                      <p className={clsx(styles.history__cellText, styles.history__centerCell)}>
                        {task.size}
                      </p>
                      <div className={clsx(styles.history__credits, styles.history__centerCell)}>
                        <span>{task.costCredits}</span>
                        <span>图片 {task.imageCount}</span>
                      </div>
                      <span
                        className={clsx(
                          styles.history__status,
                          styles.history__centerCell,
                          task.status === "succeeded" && styles.history__statusSuccess,
                          task.status === "failed" && styles.history__statusDanger,
                        )}
                      >
                        {statusLabel}
                      </span>
                      <p className={clsx(styles.history__cellText, styles.history__centerCell)}>
                        {formatDate(task.createdAt)}
                      </p>

                      <div className={styles.history__actions}>
                        {output && asset && url ? (
                          <HistoryImageActions
                            generatedImageId={output.id}
                            initialPublished={Boolean(output.galleryImage)}
                            collections={collectionOptions}
                            downloadUrl={urls.get(output.outputAsset.id) || url}
                            downloadFileName={output.outputAsset.fileName || "zroimg-image.png"}
                          />
                        ) : (
                          <TaskPoller taskId={task.id} initialStatus={task.status} />
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
