import clsx from "clsx";
import { Search } from "lucide-react";
import Link from "next/link";
import { AppPagination } from "@/components/ui/app-pagination";
import workspace from "@/features/admin/admin-workspace.module.css";
import {
  hasTaskRetries,
  isTaskRunning,
  readTaskAttempts,
  readTaskError,
  readTaskModel,
  readTaskOutputCount,
  readTaskSource,
  readTaskSpec,
  readTaskStatus,
  readTaskType,
  taskStatusLabels,
} from "@/features/admin/generation-task";
import { TaskAttempts } from "@/features/admin/task-attempts";
import { requireAdmin } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { AdminGenerationTask, AdminGenerationTaskPage } from "@/types/admin";
import { isTaskRetrying } from "@/utils/task-status";

export const dynamic = "force-dynamic";

const generationStatuses = ["processing", "succeeded", "failed"] as const;
const taskSources = ["conversation", "canvas"] as const;
const sourceLabels: Record<(typeof taskSources)[number], string> = {
  conversation: "对话",
  canvas: "画布",
};
const pageSizeOptions = [10, 20, 50];
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminGenerationsPageProps = {
  searchParams: SearchParams;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

type HrefInput = {
  q?: string;
  status?: string;
  source?: string;
  page?: number;
  pageSize?: number;
};

function href(input: HrefInput) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  if (input.source) params.set("source", input.source);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.pageSize && input.pageSize !== 20) params.set("pageSize", String(input.pageSize));
  const query = params.toString();
  return query ? `/admin/generations?${query}` : "/admin/generations";
}

function statusClass(task: AdminGenerationTask) {
  const status = task.status;
  if (status === "succeeded") return workspace.statusSuccess;
  if (isTaskRetrying(task)) return workspace.statusWarning;
  if (isTaskRunning(status)) return workspace.statusInfo;
  if (status === "failed") return workspace.statusDanger;
  return undefined;
}

export default async function AdminGenerationsPage(props: AdminGenerationsPageProps) {
  await requireAdmin();
  const searchParams = props.searchParams;

  const params = await searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const requestedPageSize = Number(readParam(params, "pageSize") || 20);
  const pageSize = pageSizeOptions.includes(requestedPageSize) ? requestedPageSize : 20;
  const isKnownStatus = generationStatuses.includes(status as (typeof generationStatuses)[number]);
  const requestedSource = readParam(params, "source");
  const source = taskSources.find((item) => item === requestedSource);
  const statusFilter = isKnownStatus ? status : undefined;
  const taskPage = await requestJava<AdminGenerationTaskPage>("/generation/admin/tasks", {
    params: {
      pageNo: page,
      pageSize,
      q,
      status: statusFilter,
      source,
      sortBy: "create_time",
      isAsc: false,
    },
  });
  const tasks = taskPage.list;
  const total = taskPage.total;

  return (
    <div className={workspace.workspace}>
      <header className={workspace.header}>
        <div className={workspace.headerCopy}>
          <h1 className="page-title">生成任务</h1>
        </div>
      </header>

      <section className={workspace.panel}>
        <div className={workspace.toolbar}>
          <form className={workspace.search}>
            <Search size={15} aria-hidden="true" />
            <input name="q" defaultValue={q || ""} placeholder="搜索提示词、模型或用户名" />
            {isKnownStatus ? <input type="hidden" name="status" value={status} /> : null}
            {source ? <input type="hidden" name="source" value={source} /> : null}
            {pageSize !== 20 ? <input type="hidden" name="pageSize" value={pageSize} /> : null}
            <button type="submit">搜索</button>
          </form>

          <nav className={workspace.filters} aria-label="任务状态筛选">
            <Link
              className={!isKnownStatus ? workspace.filterActive : undefined}
              href={href({ q, source, pageSize })}
            >
              全部
            </Link>
            {generationStatuses.map((item) => (
              <Link
                key={item}
                className={status === item ? workspace.filterActive : undefined}
                href={href({ q, status: item, source, page: 1, pageSize })}
              >
                {taskStatusLabels[item]}
              </Link>
            ))}
          </nav>

          <nav className={workspace.filters} aria-label="任务来源筛选">
            <Link
              className={!source ? workspace.filterActive : undefined}
              href={href({ q, status: statusFilter, pageSize })}
            >
              全部
            </Link>
            {taskSources.map((item) => (
              <Link
                key={item}
                className={source === item ? workspace.filterActive : undefined}
                href={href({ q, status: statusFilter, source: item, page: 1, pageSize })}
              >
                {sourceLabels[item]}
              </Link>
            ))}
          </nav>
        </div>

        {tasks.length > 0 ? (
          <div className={workspace.tableWrap}>
            <table className={clsx(workspace.table, workspace.tableCenter)}>
              <colgroup>
                <col className={workspace.colMd} />
                <col />
                <col className={workspace.colSm} />
                <col className={workspace.colXs} />
                <col className={workspace.colLg} />
                <col className={workspace.colSm} />
                <col className={workspace.colXs} />
                <col className={workspace.colStatus} />
                <col className={workspace.colTime} />
              </colgroup>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>提示词</th>
                  <th>类型</th>
                  <th>来源</th>
                  <th>模型配置</th>
                  <th>消耗 / 输出</th>
                  <th>重试</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const userName = task.username || task.userEmail || "-";

                  return (
                    <tr key={task.id}>
                      <td>
                        <div className={workspace.primaryCell}>
                          <span className={workspace.primaryText} title={userName}>
                            {userName}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={workspace.primaryCell}>
                          <span
                            className={clsx(workspace.truncate, workspace.taskPrompt)}
                            title={task.prompt}
                          >
                            {task.prompt}
                          </span>
                          {task.failReason ? (
                            <span
                              className={clsx(workspace.secondaryText, workspace.truncate)}
                              title={task.failReason}
                            >
                              失败原因：{task.failReason}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>{readTaskType(task)}</td>
                      <td>{readTaskSource(task)}</td>
                      <td>
                        <div className={workspace.primaryCell}>
                          <span className={workspace.truncate}>{readTaskModel(task)}</span>
                          <span className={clsx(workspace.secondaryText, workspace.truncate)}>
                            {readTaskSpec(task)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={workspace.primaryCell}>
                          <span className={workspace.numeric}>{task.requiredPoints} 积分</span>
                          <span className={workspace.secondaryText}>
                            {readTaskOutputCount(task)} 个结果
                          </span>
                        </div>
                      </td>
                      <td>
                        {(task.attemptCount ?? 0) > 0 ? (
                          <TaskAttempts
                            taskNo={task.taskNo}
                            label={hasTaskRetries(task) ? readTaskAttempts(task) : "—"}
                            isActive={hasTaskRetries(task)}
                          />
                        ) : (
                          <span className={workspace.secondaryText}>—</span>
                        )}
                      </td>
                      <td>
                        <span
                          className={clsx(workspace.status, statusClass(task))}
                          title={readTaskError(task)}
                        >
                          {readTaskStatus(task)}
                        </span>
                      </td>
                      <td className={workspace.dateText}>{formatDate(task.createTime)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={workspace.empty}>没有匹配的任务</div>
        )}

        <footer className={workspace.footer}>
          <AppPagination current={page} pageSize={pageSize} total={total} />
        </footer>
      </section>
    </div>
  );
}
