import clsx from "clsx";
import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { AppPagination } from "@/components/ui/app-pagination";
import workspace from "@/features/admin/admin-workspace.module.css";
import { requireAdmin } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { AdminTicketPage } from "@/types/admin";
import { feedbackTypeLabels } from "@/utils/feedback";
import { TicketTypeFilter } from "./ticket-type-filter";

export const dynamic = "force-dynamic";

const pageSizeOptions = [10, 20, 50];
const ticketStatuses = ["open", "in_progress", "resolved"] as const;
const ticketTypes = Object.keys(feedbackTypeLabels) as Array<keyof typeof feedbackTypeLabels>;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminTicketsPageProps = {
  searchParams: SearchParams;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

function readTypeLabel(type: string) {
  return feedbackTypeLabels[type as keyof typeof feedbackTypeLabels] ?? type;
}

function readStatusLabel(status: string) {
  if (status === "open") return "待处理";
  if (status === "in_progress") return "处理中";
  if (status === "resolved") return "已处理";
  if (status === "closed") return "已处理";
  return status;
}

function readStatusClassName(status: string) {
  if (status === "open") return workspace.statusWarning;
  if (status === "in_progress") return workspace.statusInfo;
  if (status === "resolved" || status === "closed") return workspace.statusSuccess;
  return undefined;
}

function filterHref(input: { q?: string; status?: string; type?: string; pageSize?: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  if (input.type) params.set("type", input.type);
  if (input.pageSize && input.pageSize !== 20) params.set("pageSize", String(input.pageSize));
  const query = params.toString();
  return query ? `/admin/tickets?${query}` : "/admin/tickets";
}

export default async function AdminTicketsPage(props: AdminTicketsPageProps) {
  await requireAdmin();
  const params = await props.searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const type = readParam(params, "type");
  const statusFilter = ticketStatuses.includes(status as (typeof ticketStatuses)[number])
    ? status
    : undefined;
  const typeFilter = ticketTypes.includes(type as (typeof ticketTypes)[number]) ? type : undefined;
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const requestedPageSize = Number(readParam(params, "pageSize") || 20);
  const pageSize = pageSizeOptions.includes(requestedPageSize) ? requestedPageSize : 20;
  const ticketPage = await requestJava<AdminTicketPage>("/feedback/admin/tickets", {
    params: {
      pageNo: page,
      pageSize,
      q,
      status: statusFilter,
      type: typeFilter,
    },
  });
  const tickets = ticketPage.list;

  return (
    <div className={workspace.workspace}>
      <header className={workspace.header}>
        <div className={workspace.headerCopy}>
          <h1 className="page-title">意见反馈</h1>
        </div>
      </header>

      <section className={workspace.panel}>
        <div className={workspace.toolbar}>
          <div className={workspace.toolbarGroup}>
            <form className={workspace.search}>
              <Search size={15} aria-hidden="true" />
              <input name="q" defaultValue={q || ""} placeholder="搜索反馈主题或用户名" />
              {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
              {typeFilter ? <input type="hidden" name="type" value={typeFilter} /> : null}
              {pageSize !== 20 ? <input type="hidden" name="pageSize" value={pageSize} /> : null}
              <button type="submit">搜索</button>
            </form>

            <TicketTypeFilter value={typeFilter} />
          </div>

          <nav className={workspace.filters} aria-label="反馈状态筛选">
            <Link
              className={!statusFilter ? workspace.filterActive : undefined}
              href={filterHref({ q, type: typeFilter, pageSize })}
            >
              全部
            </Link>
            {ticketStatuses.map((item) => (
              <Link
                key={item}
                className={statusFilter === item ? workspace.filterActive : undefined}
                href={filterHref({ q, status: item, type: typeFilter, pageSize })}
              >
                {readStatusLabel(item)}
              </Link>
            ))}
          </nav>
        </div>

        {tickets.length > 0 ? (
          <div className={workspace.tableWrap}>
            <table className={clsx(workspace.table, workspace.ticketsTable)}>
              <thead>
                <tr>
                  <th>反馈主题</th>
                  <th>类型</th>
                  <th>用户</th>
                  <th>状态</th>
                  <th>最近更新</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const userName = ticket.user?.name || ticket.user?.email || "-";

                  return (
                    <tr key={ticket.id}>
                      <td data-label="反馈主题">
                        <div className={workspace.primaryCell}>
                          <Link
                            className={workspace.primaryText}
                            href={`/admin/tickets/${ticket.id}`}
                          >
                            {ticket.subject}
                          </Link>
                        </div>
                      </td>
                      <td data-label="类型">{readTypeLabel(ticket.type)}</td>
                      <td data-label="用户">
                        <span>{userName}</span>
                      </td>
                      <td data-label="状态">
                        <span
                          className={clsx(workspace.status, readStatusClassName(ticket.status))}
                        >
                          {readStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td data-label="最近更新" className={workspace.dateText}>
                        {formatDate(ticket.updateTime)}
                      </td>
                      <td data-label="操作">
                        <div className={workspace.rowActions}>
                          <Link
                            className={workspace.iconAction}
                            href={`/admin/tickets/${ticket.id}`}
                            title="处理反馈"
                            aria-label={`处理反馈 ${ticket.subject}`}
                          >
                            <Eye size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={workspace.empty}>没有匹配的反馈</div>
        )}

        <footer className={workspace.footer}>
          <AppPagination current={page} pageSize={pageSize} total={ticketPage.total} />
        </footer>
      </section>
    </div>
  );
}
