import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { Clock3, ImageOff } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { HistoryImageActions } from "@/features/history/history-image-actions";
import { TaskPoller } from "@/features/history/task-poller";
import { requireUser } from "@/server/auth";
import { listCollections } from "@/server/bff/account";
import { listHistoryTasks } from "@/server/bff/generation";
import { getMediaSignedUrl } from "@/server/bff/generation";
import { HistorySortSelect } from "./history-sort-select";
import styles from "./history.module.css";

export const dynamic = "force-dynamic";

const dateFilters = [
  { value: "all", label: "全部" },
  { value: "today", label: "今天" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
  { value: "year", label: "今年" },
] as const;

type DateFilter = (typeof dateFilters)[number]["value"];
type SortValue = "newest" | "oldest";
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

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeDateFilter(value?: string): DateFilter {
  const match = dateFilters.find((item) => item.value === value);
  return match?.value ?? "all";
}

function normalizeSort(value?: string): SortValue {
  if (value === "oldest") {
    return "oldest";
  }

  return "newest";
}

function getDateRange(filter: DateFilter) {
  const now = new Date();
  const from = new Date(now);

  if (filter === "today") {
    from.setHours(0, 0, 0, 0);
    return { from };
  }

  if (filter === "7d") {
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
    return { from };
  }

  if (filter === "30d") {
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    return { from };
  }

  if (filter === "year") {
    from.setMonth(0, 1);
    from.setHours(0, 0, 0, 0);
    return { from };
  }

  return {};
}

function historyHref(date: DateFilter, sort: SortValue) {
  const params = new URLSearchParams();
  if (date !== "all") params.set("date", date);
  if (sort === "oldest") params.set("sort", sort);

  const query = params.toString();
  if (query) {
    return `/history?${query}`;
  }

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
  const dateFilter = normalizeDateFilter(readParam(params, "date"));
  const sort = normalizeSort(readParam(params, "sort"));
  const range = getDateRange(dateFilter);
  const sortOrder = sort === "oldest" ? "asc" : "desc";

  const current = await requireUser();
  const tasks = await listHistoryTasks(current.profile.id, { ...range, sort: sortOrder });
  const historyItems = toHistoryItems(tasks);
  const urls = new Map<string, string>();

  for (const item of historyItems) {
    if (!item.output) continue;
    const asset = item.output.thumbnailAsset || item.output.outputAsset;
    urls.set(asset.id, await getMediaSignedUrl(asset.id));
    if (asset.id !== item.output.outputAsset.id) {
      urls.set(item.output.outputAsset.id, await getMediaSignedUrl(item.output.outputAsset.id));
    }
  }

  const activeFilter = dateFilter !== "all";
  const emptyTitle = activeFilter ? "这个时间段还没有创作记录" : "还没有创作记录";
  const emptyText = activeFilter
    ? "换一个日期范围，或查看全部历史。"
    : "写下第一句提示词，让灵感在这里留下第一张图。";
  const emptyHref = activeFilter ? historyHref("all", sort) : "/generate";
  const emptyAction = activeFilter ? "查看全部" : "去创作";
  const collections = await listCollections(current.profile.id);
  const collectionOptions = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    imageCount: collection._count.items,
  }));

  return (
    <AppShell active="history">
      <main className={styles.history}>
        <section className={styles.history__header}>
          <h1 className="page-title">创作历史</h1>
        </section>

        <section className={styles.history__toolbar} aria-label="创作历史筛选">
          <nav className={styles.history__dateFilters} aria-label="日期筛选">
            {dateFilters.map((item) => {
              const active = item.value === dateFilter;
              return (
                <Link
                  key={item.value}
                  href={historyHref(item.value, sort)}
                  className={clsx(
                    styles.history__dateFilter,
                    active && styles.history__dateFilterActive,
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <HistorySortSelect value={sort} />
        </section>

        {historyItems.length > 0 ? (
          <section className={styles.history__tableCard} aria-label="历史作品">
            <div className={styles.history__tableScroller}>
              <div className={clsx(styles.history__tableRow, styles.history__tableHead)}>
                <span>图片</span>
                <span>提示词</span>
                <span className={styles.history__centerCell}>模型</span>
                <span className={styles.history__centerCell}>分辨率</span>
                <span className={styles.history__centerCell}>消耗</span>
                <span className={styles.history__centerCell}>状态</span>
                <span className={styles.history__centerCell}>时间</span>
                <span className={styles.history__centerCell}>操作</span>
              </div>

              <div className={styles.history__tableBody}>
                {historyItems.map((item) => {
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

                      <div>
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
    </AppShell>
  );
}
