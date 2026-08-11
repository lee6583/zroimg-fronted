import clsx from "clsx";
import { Search } from "lucide-react";
import Link from "next/link";
import { AppPagination } from "@/components/ui/app-pagination";
import workspace from "@/features/admin/admin-workspace.module.css";
import { listAdminGenerations } from "@/server/bff/admin";

export const dynamic = "force-dynamic";

const generationStatuses = ["pending", "processing", "succeeded", "failed"] as const;
const pageSizeOptions = [10, 20, 50];
const generationStatusLabels: Record<string, string> = {
  pending: "排队中",
  processing: "生成中",
  succeeded: "已完成",
  failed: "失败",
};
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminGenerationsPageProps = {
  searchParams: SearchParams;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16).replace("T", " ") : "-";
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
  if (status === "processing") return workspace.statusInfo;
  if (status === "pending") return workspace.statusWarning;
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
  const taskPage = await listAdminGenerations({
    page,
    pageSize,
    q,
    status: isKnownStatus ? status : undefined,
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
            <input name="q" defaultValue={q || ""} placeholder="搜索提示词、模型或用户邮箱" />
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
                {generationStatusLabels[item]}
              </Link>
            ))}
          </nav>
        </div>

        {tasks.length > 0 ? (
          <div className={workspace.tableWrap}>
            <table className={clsx(workspace.table, workspace.tasksTable)}>
              <thead>
                <tr>
                  <th>用户 / 任务</th>
                  <th>提示词</th>
                  <th>模型配置</th>
                  <th>消耗 / 输出</th>
                  <th>状态</th>
                  <th>创建时间</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td data-label="用户 / 任务">
                      <div className={workspace.primaryCell}>
                        <span className={workspace.primaryText}>{task.userEmail}</span>
                        <span className={workspace.monoText} title={task.id}>
                          {task.id}
                        </span>
                      </div>
                    </td>
                    <td data-label="提示词">
                      <div className={workspace.primaryCell}>
                        <span className={workspace.truncate} title={task.prompt}>
                          {task.prompt}
                        </span>
                        {task.failReason ? (
                          <span className={workspace.secondaryText} title={task.failReason}>
                            失败原因：{task.failReason}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="模型配置">
                      <div className={workspace.primaryCell}>
                        <span>{task.model}</span>
                        <span className={workspace.secondaryText}>
                          {task.mode} · {task.size} · {task.quality}
                        </span>
                      </div>
                    </td>
                    <td data-label="消耗 / 输出">
                      <div className={workspace.primaryCell}>
                        <span className={workspace.numeric}>{task.requiredPoints} 积分</span>
                        <span className={workspace.secondaryText}>{task.outputCount} 张图片</span>
                      </div>
                    </td>
                    <td data-label="状态">
                      <span className={clsx(workspace.status, statusClass(task.status))}>
                        {generationStatusLabels[task.status] ?? task.status}
                      </span>
                    </td>
                    <td data-label="创建时间" className={workspace.dateText}>
                      {formatDate(task.createdAt)}
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
