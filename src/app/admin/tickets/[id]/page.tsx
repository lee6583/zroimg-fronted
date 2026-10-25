import clsx from "clsx";
import { ArrowLeft, MessageSquareText, Paperclip } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FeedbackActions } from "@/features/admin/feedback-actions";
import { JavaApiError, requestJava } from "@/server/java-api";
import type { AdminTicket } from "@/types/admin";
import type { FeedbackStatus } from "@/utils/feedback";
import styles from "../tickets.module.css";

export const dynamic = "force-dynamic";

type AdminTicketDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

function readStatus(status: string): FeedbackStatus {
  if (status === "in_progress" || status === "resolved" || status === "closed") {
    return status;
  }

  return "open";
}

async function loadTicket(id: string) {
  try {
    return await requestJava<AdminTicket>(`/feedback/admin/tickets/${id}`);
  } catch (error) {
    // Java 对不存在的工单返回 400，而不是 404。
    if (error instanceof JavaApiError && error.status === 400) {
      return null;
    }

    throw error;
  }
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
  const params = await props.params;
  const ticket = await loadTicket(params.id);
  if (!ticket) notFound();

  const statusClassName = readStatusClassName(ticket.status);

  return (
    <div className={styles.adminTickets}>
      <section className={styles.adminTickets__detailHeader}>
        <Link href="/admin/tickets" className={styles.adminTickets__detailBack}>
          <ArrowLeft size={15} aria-hidden="true" />
          返回意见反馈
        </Link>
        <h1 className="page-title">工单处理</h1>
      </section>

      <section className={styles.adminTickets__workbench}>
        <div className={styles.adminTickets__mainColumn}>
          <article className={styles.adminTickets__ticketCard}>
            <header className={styles.adminTickets__detailPanelHead}>
              <h2>{ticket.subject}</h2>
            </header>

            <div className={styles.adminTickets__ticketQuestion}>
              <div className={styles.adminTickets__detailContent}>
                <p>{ticket.content}</p>
              </div>

              {ticket.attachments.length ? (
                <div className={styles.adminTickets__attachments}>
                  <div className={styles.adminTickets__attachmentList}>
                    {ticket.attachments.map((attachment) => (
                      <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer">
                        <Paperclip size={14} aria-hidden="true" />
                        {attachment.fileName || `附件 ${attachment.id}`}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </article>

          <section className={styles.adminTickets__messagesBlock}>
            <header className={styles.adminTickets__messagesHeader}>
              <h2>
                <MessageSquareText size={17} aria-hidden="true" />
                沟通记录
              </h2>
              <span>{ticket.messages.length} 条</span>
            </header>
            <div className={styles.adminTickets__messagesList}>
              {ticket.messages.length ? (
                ticket.messages.map((message) => {
                  const authorName = message.authorName || ticket.user?.name || "用户";

                  return (
                    <div
                      key={message.id}
                      className={clsx(
                        styles.adminTickets__message,
                        message.isAdmin && styles.adminTickets__messageAdmin,
                      )}
                    >
                      <span className={styles.adminTickets__messageAvatar}>
                        {message.isAdmin ? "管" : authorName.slice(0, 1)}
                      </span>
                      <div className={styles.adminTickets__messageContent}>
                        <p className={styles.adminTickets__messageMeta}>
                          <span>{message.isAdmin ? "管理员" : authorName}</span>
                          <time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
                        </p>
                        <p className={styles.adminTickets__messageBody}>{message.body}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className={styles.adminTickets__emptyMessage}>暂无沟通记录</p>
              )}
            </div>
          </section>
        </div>

        <aside className={styles.adminTickets__handlingPanel}>
          <header className={styles.adminTickets__handlingHeader}>
            <h2>处理工单</h2>
            <span className={clsx(styles.adminTickets__statusText, statusClassName)}>
              <span className={styles.adminTickets__statusDot} aria-hidden="true" />
              {readStatusLabel(ticket.status)}
            </span>
          </header>
          <div className={styles.adminTickets__handlingBody}>
            <FeedbackActions ticketId={ticket.id} currentStatus={readStatus(ticket.status)} />
          </div>
        </aside>
      </section>
    </div>
  );
}
