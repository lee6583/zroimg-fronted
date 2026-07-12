import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { FeedbackActions } from "@/features/admin/feedback-actions";
import { requireAdmin } from "@/server/auth";
import { listAdminTickets } from "@/server/bff/account";
import { feedbackStatusLabels, feedbackTypeLabels } from "@/utils/feedback";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminTicketsPageProps = {
  searchParams: SearchParams;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 16).replace("T", " ");
}

function href(input: { q?: string; status?: string; type?: string; page: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  if (input.type) params.set("type", input.type);
  params.set("page", String(input.page));
  return `/admin/tickets?${params.toString()}`;
}

export default async function AdminTicketsPage(props: AdminTicketsPageProps) {
  const searchParams = props.searchParams;

  await requireAdmin();
  const params = await searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const type = readParam(params, "type");
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const { tickets, total, pageSize } = await listAdminTickets({
    q,
    status,
    type,
    page,
    pageSize: 20,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell active="tickets">
      <div className="grid gap-6">
        <section>
          <p className="label">Feedback</p>
          <h1 className="page-title">意见反馈</h1>
          <p className="page-description">查看用户反馈、回复用户，并更新处理状态。</p>
        </section>

        <section className="surface rounded-xl p-5">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className="field text-sm"
              name="q"
              defaultValue={q || ""}
              placeholder="搜索标题、内容或用户邮箱"
            />
            <button className="btn-primary" type="submit">
              搜索
            </button>
            {type ? <input type="hidden" name="type" value={type} /> : null}
            {status ? <input type="hidden" name="status" value={status} /> : null}
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className={`btn-secondary ${!status ? "bg-soft" : ""}`}
              href={href({ q, type, page: 1 })}
            >
              全部状态
            </Link>
            {Object.entries(feedbackStatusLabels).map(([key, label]) => (
              <Link
                key={key}
                className={`btn-secondary ${status === key ? "bg-soft" : ""}`}
                href={href({ q, type, status: key, page: 1 })}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              className={`btn-secondary ${!type ? "bg-soft" : ""}`}
              href={href({ q, status, page: 1 })}
            >
              全部类型
            </Link>
            {Object.entries(feedbackTypeLabels).map(([key, label]) => (
              <Link
                key={key}
                className={`btn-secondary ${type === key ? "bg-soft" : ""}`}
                href={href({ q, status, type: key, page: 1 })}
              >
                {label}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="surface rounded-xl p-5">
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-muted">
                    {feedbackTypeLabels[ticket.type]} / {feedbackStatusLabels[ticket.status]} /{" "}
                    {ticket.userProfile?.user?.email || "-"}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{ticket.subject}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                    {ticket.content}
                  </p>
                </div>
                <p className="text-xs text-muted">{formatDate(ticket.createdAt)}</p>
              </div>

              <div className="mt-4 grid gap-2">
                {ticket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg border border-line p-3 ${message.isAdmin ? "bg-soft" : "bg-panel"}`}
                  >
                    <p className="text-xs font-medium text-muted">
                      {message.isAdmin ? "管理员" : message.authorProfile.username} /{" "}
                      {formatDate(message.createdAt)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl border border-line p-3">
                <FeedbackActions ticketId={ticket.id} currentStatus={ticket.status} />
              </div>
            </article>
          ))}
          {tickets.length === 0 ? (
            <p className="surface rounded-xl p-8 text-center text-sm text-muted">没有匹配反馈</p>
          ) : null}
        </section>

        <nav className="flex items-center justify-between">
          <Link
            className="btn-secondary"
            href={href({ q, status, type, page: Math.max(1, page - 1) })}
          >
            上一页
          </Link>
          <p className="text-sm text-muted">
            第 {page} / {totalPages} 页，共 {total} 条反馈
          </p>
          <Link
            className="btn-secondary"
            href={href({ q, status, type, page: Math.min(totalPages, page + 1) })}
          >
            下一页
          </Link>
        </nav>
      </div>
    </AdminShell>
  );
}
