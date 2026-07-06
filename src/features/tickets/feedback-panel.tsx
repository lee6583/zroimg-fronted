"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppSelect } from "@/components/app-select";
import { type FeedbackStatus, type FeedbackType, feedbackStatusLabels, feedbackTypeLabels } from "@/shared/feedback";
import styles from "./feedback-panel.module.css";

type TicketMessage = {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
  authorName: string;
};

export type TicketItem = {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

const typeOptions = Object.entries(feedbackTypeLabels).map(([value, label]) => ({
  value: value as FeedbackType,
  label,
}));

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FeedbackPanel({ initialTickets }: { initialTickets: TicketItem[] }) {
  const router = useRouter();
  const [type, setType] = useState<FeedbackType>("generation");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [activeTicketId, setActiveTicketId] = useState(initialTickets[0]?.id || "");
  const [reply, setReply] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const activeTicket = initialTickets.find((ticket) => ticket.id === activeTicketId) ?? initialTickets[0];

  async function submitTicket() {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, subject, content }),
    });
    const data = (await response.json()) as { ticket?: TicketItem; error?: string };
    setLoading(false);
    if (!response.ok || !data.ticket) {
      setMessage(data.error || "提交反馈失败");
      return;
    }
    setSubject("");
    setContent("");
    setActiveTicketId(data.ticket.id);
    setMessage("反馈已提交，我们会尽快查看。");
    router.refresh();
  }

  async function submitReply() {
    if (!activeTicket || !reply.trim()) return;
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/tickets/${activeTicket.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: reply }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error || "发送追问失败");
      return;
    }
    setReply("");
    setMessage("追问已发送。");
    router.refresh();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
      <section className="surface rounded-xl p-5">
        <p className="label">New feedback</p>
        <h2 className="mt-2 font-serif text-2xl font-medium tracking-tight">提交反馈</h2>
        <div className="mt-5 grid gap-3">
          <label className="grid gap-2">
            <span className="text-sm font-medium">反馈类型</span>
            <AppSelect value={type} onChange={setType} options={typeOptions} triggerClassName="min-h-10 text-sm" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium">标题</span>
            <input className="field text-sm" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="例如：生成任务一直失败" />
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
          <button type="button" className="btn-primary" disabled={loading || !subject.trim() || !content.trim()} onClick={submitTicket}>
            {loading ? "提交中" : "提交反馈"}
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
                  onClick={() => setActiveTicketId(ticket.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    ticket.id === activeTicket?.id ? "border-line bg-soft text-foreground" : "border-line bg-panel text-muted hover:bg-soft hover:text-foreground"
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
                    <p className={styles.feedbackPanel__ticketMeta}>{feedbackTypeLabels[activeTicket.type]} / {feedbackStatusLabels[activeTicket.status]}</p>
                    <h3 className="mt-1 text-lg font-semibold">{activeTicket.subject}</h3>
                  </div>
                  <p className="text-xs text-muted">{formatDate(activeTicket.createdAt)}</p>
                </div>
                <div className="mt-4 grid gap-3">
                  {activeTicket.messages.map((item) => (
                    <div key={item.id} className={classNames(styles.feedbackPanel__message, item.isAdmin && styles.feedbackPanel__messageAdmin)}>
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
                    placeholder={activeTicket.status === "closed" ? "反馈已关闭，不能继续追问。" : "继续补充信息..."}
                    disabled={activeTicket.status === "closed"}
                  />
                  <button type="button" className="btn-secondary w-fit" disabled={loading || !reply.trim() || activeTicket.status === "closed"} onClick={submitReply}>
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
