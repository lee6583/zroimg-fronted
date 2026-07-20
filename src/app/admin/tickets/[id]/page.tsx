import clsx from "clsx";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { FeedbackActions } from "@/features/admin/feedback-actions";
import { requireAdmin } from "@/server/auth";
import { getAdminTicket } from "@/server/bff/account";
import { feedbackTypeLabels } from "@/utils/feedback";
import styles from "../tickets.module.css";

export const dynamic = "force-dynamic";

type AdminTicketDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return value.toISOString().slice(0, 16).replace("T", " ");
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

export default async function AdminTicketDetailPage(props: AdminTicketDetailPageProps) {
  await requireAdmin();

  const { id } = await props.params;
  const ticket = await getAdminTicket(id);
  if (!ticket) notFound();

  const userName = ticket.userProfile.username || ticket.userProfile.user?.name || "-";
  const statusClassName = readStatusClassName(ticket.status);

  return (
    <AdminShell active="tickets">
      <div className={styles.adminTickets}>
        <section className={styles.adminTickets__detailHeader}>
          <Link
            href="/admin/tickets"
            className="text-sm font-medium text-muted transition hover:text-foreground"
          >
            返回意见反馈列表
          </Link>
          <div className={styles.adminTickets__detailTitleRow}>
            <div>
              <h1 className="page-title">工单处理</h1>
            </div>
          </div>
        </section>

        <section className={styles.adminTickets__workbench}>
          <article className={styles.adminTickets__ticketCard}>
            <div className={styles.adminTickets__ticketQuestion}>
              <div className={styles.adminTickets__detailPanelHead}>
                <h2>{ticket.subject}</h2>
              </div>

              <div className={styles.adminTickets__detailContent}>
                <p>{ticket.content}</p>
              </div>

              <div className={styles.adminTickets__attachments}>
                <p className={styles.adminTickets__sectionTitle}>提交附件</p>
                {ticket.attachments.length ? (
                  <div className={styles.adminTickets__attachmentList}>
                    {ticket.attachments.map((attachment) => (
                      <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer">
                        {attachment.fileName || `附件 ${attachment.id}`}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className={styles.adminTickets__emptyMessage}>暂无附件</p>
                )}
              </div>
            </div>

            <div className={styles.adminTickets__ticketMetaBar}>
              <span>{feedbackTypeLabels[ticket.type]}</span>
              <span className={clsx(styles.adminTickets__statusText, statusClassName)}>
                <span className={styles.adminTickets__statusDot} aria-hidden="true" />
                {readStatusLabel(ticket.status)}
              </span>
              <span>提问人：{userName}</span>
              <span>提交时间：{formatDate(ticket.createdAt)}</span>
            </div>

            <div className={styles.adminTickets__ticketActions}>
              <FeedbackActions ticketId={ticket.id} currentStatus={ticket.status} />
            </div>
          </article>

          <div className={styles.adminTickets__messagesBlock}>
            <p className={styles.adminTickets__sectionTitle}>沟通记录</p>
            <div className={styles.adminTickets__messagesList}>
              {ticket.messages.length ? (
                ticket.messages.map((message) => (
                  <div
                    key={message.id}
                    className={clsx(
                      styles.adminTickets__message,
                      message.isAdmin && styles.adminTickets__messageAdmin,
                    )}
                  >
                    <span className={styles.adminTickets__messageAvatar}>
                      {message.isAdmin ? "管" : message.authorProfile.username.slice(0, 1)}
                    </span>
                    <div className={styles.adminTickets__messageContent}>
                      <p className={styles.adminTickets__messageMeta}>
                        <span>{message.isAdmin ? "管理员" : message.authorProfile.username}</span>
                        <span>{formatDate(message.createdAt)}</span>
                      </p>
                      <p className={styles.adminTickets__messageBody}>{message.body}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className={styles.adminTickets__emptyMessage}>暂无沟通记录</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
