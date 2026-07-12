"use client";

import clsx from "clsx";
import { getErrorMessage } from "@/utils/error";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ticketsApi } from "@/api/support/tickets";
import { AppSelect } from "@/components/ui/app-select";
import type { TicketItem } from "@/types/feedback";
import { type FeedbackType, feedbackStatusLabels, feedbackTypeLabels } from "@/utils/feedback";
import styles from "./feedback-panel.module.css";
export type { TicketItem };

const typeOptions = Object.entries(feedbackTypeLabels).map(([value, label]) => ({
  value: value as FeedbackType,
  label,
}));

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

type FeedbackPanelProps = {
  initialTickets: TicketItem[];
};

export function FeedbackPanel(props: FeedbackPanelProps) {
  const initialTickets = props.initialTickets;

  const router = useRouter();
  const [type, setType] = useState<FeedbackType>("generation");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [activeId, setActiveId] = useState(initialTickets[0]?.id || "");
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const activeTicket = initialTickets.find((ticket) => ticket.id === activeId) ?? initialTickets[0];

  async function submitTicket() {
    setLoading(true);
    setMessage("");
    try {
      const data = await ticketsApi.createTicket({
        type,
        subject,
        content,
      });
      setLoading(false);
      if (!data.ticket) {
        setMessage("提交反馈失败");
        return;
      }
      setSubject("");
      setContent("");
      setActiveId(data.ticket.id);
      setMessage("反馈已提交，我们会尽快查看。");
      router.refresh();
    } catch (error) {
      setLoading(false);
      setMessage(getErrorMessage(error));
      return;
    }
  }

  async function submitReply() {
    if (!activeTicket || !reply.trim()) return;
    setLoading(true);
    setMessage("");
    try {
      await ticketsApi.replyTicket(activeTicket.id, { body: reply });
      setLoading(false);
      setReply("");
      setMessage("追问已发送。");
      router.refresh();
    } catch (error) {
      setLoading(false);
      setMessage(getErrorMessage(error));
      return;
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <section className="surface rounded-xl p-5">
        <p className="label">New feedback</p>
        <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight">提交反馈</h2>
        <div className="mt-5 grid gap-3">
          <label className="grid gap-2">
            <span className="text-sm font-medium">反馈类型</span>
            <AppSelect
              value={type}
              onChange={setType}
              options={typeOptions}
              triggerClassName="min-h-10 text-sm"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">标题</span>
            <input
              className="field text-sm"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="例如：生成任务一直失败"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">详细描述</span>
            <textarea
              className="field min-h-32 resize-y text-sm leading-6"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="请说明你遇到的问题、订单号、任务情况或建议。"
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            disabled={isLoading || !subject.trim() || !content.trim()}
            onClick={submitTicket}
          >
            {isLoading ? "提交中" : "提交反馈"}
          </button>
          {message ? <p className="text-sm text-muted">{message}</p> : null}
        </div>
      </section>

      <section className="surface rounded-xl p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="label">My feedback</p>
            <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight">反馈记录</h2>
          </div>
          <p className="text-sm text-muted">{initialTickets.length} 条</p>
        </div>

        {initialTickets.length === 0 ? (
          <div className={styles.feedbackPanel__empty}>还没有反馈记录，提交后会显示在这里。</div>
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="grid content-start gap-2">
              {initialTickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setActiveId(ticket.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    ticket.id === activeTicket?.id
                      ? "border-line bg-soft text-foreground"
                      : "border-line bg-panel text-muted hover:bg-soft hover:text-foreground"
                  }`}
                >
                  <span className="block truncate text-sm font-semibold">{ticket.subject}</span>
                  <span className="mt-1 flex items-center justify-between gap-2 text-xs">
                    <span>{feedbackStatusLabels[ticket.status]}</span>
                    <span>{formatDate(ticket.updatedAt)}</span>
                  </span>
                </button>
              ))}
            </div>

            {activeTicket ? (
              <article className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className={styles.feedbackPanel__ticketMeta}>
                      {feedbackTypeLabels[activeTicket.type]} /{" "}
                      {feedbackStatusLabels[activeTicket.status]}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">{activeTicket.subject}</h3>
                  </div>
                  <p className="text-xs text-muted">{formatDate(activeTicket.createdAt)}</p>
                </div>
                <div className="mt-4 grid gap-3">
                  {activeTicket.messages.map((item) => (
                    <div
                      key={item.id}
                      className={clsx(
                        styles.feedbackPanel__message,
                        item.isAdmin && styles.feedbackPanel__messageAdmin,
                      )}
                    >
                      <p className="text-xs font-medium text-muted">
                        {item.isAdmin ? "管理员" : item.authorName} / {formatDate(item.createdAt)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{item.body}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2">
                  <textarea
                    className="field min-h-24 resize-y text-sm leading-6"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder={
                      activeTicket.status === "closed"
                        ? "反馈已关闭，不能继续追问。"
                        : "继续补充信息..."
                    }
                    disabled={activeTicket.status === "closed"}
                  />
                  <button
                    type="button"
                    className="btn-secondary w-fit"
                    disabled={isLoading || !reply.trim() || activeTicket.status === "closed"}
                    onClick={submitReply}
                  >
                    发送追问
                  </button>
                </div>
              </article>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
