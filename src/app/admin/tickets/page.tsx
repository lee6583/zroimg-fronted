import clsx from "clsx";
import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/server/auth";
import { listAdminTickets } from "@/server/bff/account";
import { feedbackTypeLabels } from "@/utils/feedback";
import styles from "./tickets.module.css";

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

function href(input: { q?: string; page: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  params.set("page", String(input.page));
  return `/admin/tickets?${params.toString()}`;
}

function readStatusLabel(status: string) {
  if (status === "open") return "待处理";
  if (status === "in_progress") return "处理中";
  if (status === "resolved") return "已处理";
  if (status === "closed") return "已处理";
  return status;
}

function readStatusClassName(status: string) {
  if (status === "open") return styles.adminTickets__statusOpen;
  if (status === "in_progress") return styles.adminTickets__statusProgress;
  if (status === "resolved") return styles.adminTickets__statusDone;
  if (status === "closed") return styles.adminTickets__statusDone;
  return styles.adminTickets__statusMuted;
}

export default async function AdminTicketsPage(props: AdminTicketsPageProps) {
  const searchParams = props.searchParams;

  await requireAdmin();
  const params = await searchParams;
  const q = readParam(params, "q")?.trim();
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const { tickets, total, pageSize } = await listAdminTickets({
    q,
    page,
    pageSize: 20,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell active="tickets">
      <div className={styles.adminTickets}>
        <section className={styles.adminTickets__header}>
          <div>
            <p className="label">Support Tickets</p>
            <h1 className="page-title">意见反馈</h1>
          </div>
          <p className={styles.adminTickets__summary}>
            共 {total} 条，第 {page} / {totalPages} 页
          </p>
        </section>

        <section className={styles.adminTickets__filters}>
          <form className={styles.adminTickets__searchForm}>
            <input
              className="field text-sm"
              name="q"
              defaultValue={q || ""}
              placeholder="搜索标题、内容或用户邮箱"
            />
            <button className="btn-primary" type="submit">
              搜索
            </button>
          </form>
        </section>

        <section className={styles.adminTickets__list}>
          {tickets.map((ticket) => {
            const userEmail = ticket.userProfile?.user?.email || "-";
            const userName = ticket.userProfile?.username || ticket.userProfile?.user?.name || "-";
            const statusClassName = readStatusClassName(ticket.status);

            return (
              <Link
                key={ticket.id}
                className={clsx(styles.adminTickets__card, styles.adminTickets__cardLink)}
                href={`/admin/tickets/${ticket.id}`}
              >
                <div className={styles.adminTickets__cardHeader}>
                  <div className={styles.adminTickets__cardMain}>
                    <p className={styles.adminTickets__metaLine}>
                      <span>{feedbackTypeLabels[ticket.type]}</span>
                      <span
                        className={clsx(styles.adminTickets__statusText, statusClassName)}
                      >
                        <span className={styles.adminTickets__statusDot} aria-hidden="true" />
                        {readStatusLabel(ticket.status)}
                      </span>
                    </p>
                    <h2 className={styles.adminTickets__title}>{ticket.subject}</h2>
                    <p className={styles.adminTickets__content}>{ticket.content}</p>
                  </div>
                  <div className={styles.adminTickets__sideMeta}>
                    <span>{formatDate(ticket.createdAt)}</span>
                    <strong>{userEmail}</strong>
                    <span>{userName}</span>
                  </div>
                </div>
              </Link>
            );
          })}
          {tickets.length === 0 ? (
            <p className={styles.adminTickets__empty}>没有匹配的反馈</p>
          ) : null}
        </section>

        <nav className={styles.adminTickets__pagination}>
          <Link
            className={clsx("btn-secondary", page <= 1 && styles.adminTickets__paginationDisabled)}
            href={href({ q, page: Math.max(1, page - 1) })}
          >
            上一页
          </Link>
          <p>
            第 {page} / {totalPages} 页，当前显示 {tickets.length} 条
          </p>
          <Link
            className={clsx(
              "btn-secondary",
              page >= totalPages && styles.adminTickets__paginationDisabled,
            )}
            href={href({ q, page: Math.min(totalPages, page + 1) })}
          >
            下一页
          </Link>
        </nav>
      </div>
    </AdminShell>
  );
}
