import clsx from "clsx";
import { Search } from "lucide-react";
import Link from "next/link";
import { AppPagination } from "@/components/ui/app-pagination";
import workspace from "@/features/admin/admin-workspace.module.css";
import {
  isTaskRunning,
  readTaskModel,
  readTaskOutputCount,
  readTaskSpec,
  readTaskType,
  taskStatusLabels,
} from "@/features/admin/generation-task";
import { requestJava } from "@/server/java-api";
import type { AdminGenerationTaskPage } from "@/types/admin";

export const dynamic = "force-dynamic";

const generationStatuses = ["processing", "succeeded", "failed"] as const;
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

function href(input: { q?: string; status?: string; page?: number; pageSize?: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.pageSize && input.pageSize !== 20) params.set("pageSize", String(input.pageSize));
  const query = params.toString();
  return query ? `/admin/generations?${query}` : "/admin/generations";
}

function statusClass(status: string) {
  if (status === "succeeded") return workspace.statusSuccess;
  if (isTaskRunning(status)) return workspace.statusInfo;
  if (status === "failed") return workspace.statusDanger;
  return undefined;
}

export default async function AdminGenerationsPage(props: AdminGenerationsPageProps) {
  const searchParams = props.searchParams;

  const params = await searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const requestedPageSize = Number(readParam(params, "pageSize") || 20);
  const pageSize = pageSizeOptions.includes(requestedPageSize) ? requestedPageSize : 20;
  const isKnownStatus = generationStatuses.includes(status as (typeof generationStatuses)[number]);
  const taskPage = await requestJava<AdminGenerationTaskPage>("/generation/admin/tasks", {
    params: {
      pageNo: page,
      pageSize,
      q,
      status: isKnownStatus ? status : undefined,
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
            {pageSize !== 20 ? <input type="hidden" name="pageSize" value={pageSize} /> : null}
            <button type="submit">搜索</button>
          </form>

          <nav className={workspace.filters} aria-label="任务状态筛选">
            <Link
              className={!isKnownStatus ? workspace.filterActive : undefined}
              href={href({ q, pageSize })}
            >
              全部
            </Link>
            {generationStatuses.map((item) => (
              <Link
                key={item}
                className={status === item ? workspace.filterActive : undefined}
                href={href({ q, status: item, page: 1, pageSize })}
              >
                {taskStatusLabels[item]}
              </Link>
            ))}
          </nav>
        </div>

        {tasks.length > 0 ? (
          <div className={workspace.tableWrap}>
            <table className={clsx(workspace.table, workspace.tasksTable)}>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>提示词</th>
                  <th>类型</th>
                  <th>模型配置</th>
                  <th>消耗 / 输出</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td data-label="用户">
                      <div className={workspace.primaryCell}>
                        <span className={workspace.primaryText}>
                          {task.username || task.userEmail || "-"}
                        </span>
                      </div>
                    </td>
                    <td data-label="提示词">
                      <div className={workspace.primaryCell}>
                        <span
                          className={clsx(workspace.truncate, workspace.taskPrompt)}
                          title={task.prompt}
                        >
                          {task.prompt}
                        </span>
                        {task.failReason ? (
                          <span className={workspace.secondaryText} title={task.failReason}>
                            失败原因：{task.failReason}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="类型">{readTaskType(task)}</td>
                    <td data-label="模型配置">
                      <div className={workspace.primaryCell}>
                        <span>{readTaskModel(task)}</span>
                        <span className={workspace.secondaryText}>{readTaskSpec(task)}</span>
                      </div>
                    </td>
                    <td data-label="消耗 / 输出">
                      <div className={workspace.primaryCell}>
                        <span className={workspace.numeric}>{task.requiredPoints} 积分</span>
                        <span className={workspace.secondaryText}>
                          {readTaskOutputCount(task)} 个结果
                        </span>
                      </div>
                    </td>
                    <td data-label="状态">
                      <span className={clsx(workspace.status, statusClass(task.status))}>
                        {taskStatusLabels[task.status] ?? task.status}
                      </span>
                    </td>
                    <td data-label="创建时间" className={workspace.dateText}>
                      {formatDate(task.createTime)}
                    </td>
                  </tr>
                ))}
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
