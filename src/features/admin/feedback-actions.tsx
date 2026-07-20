"use client";

import clsx from "clsx";
import { getErrorMessage } from "@/utils/error";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ticketsApi } from "@/api/support/tickets";
import type { FeedbackStatus } from "@/utils/feedback";
import styles from "./feedback-actions.module.css";

const statusOptions: Array<{ value: FeedbackStatus; label: string; className: string }> = [
  { value: "open", label: "待处理", className: styles.feedbackActions__statusOpen },
  { value: "in_progress", label: "处理中", className: styles.feedbackActions__statusProgress },
  { value: "resolved", label: "已处理", className: styles.feedbackActions__statusDone },
];

type FeedbackActionsProps = {
  ticketId: string;
  currentStatus: FeedbackStatus;
};

export function FeedbackActions(props: FeedbackActionsProps) {
  const ticketId = props.ticketId;
  const currentStatus = props.currentStatus;

  const router = useRouter();
  const [status, setStatus] = useState<FeedbackStatus>(
    currentStatus === "closed" ? "resolved" : currentStatus,
  );
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);

  async function updateStatus(nextStatus: FeedbackStatus) {
    setLoading(true);
    setMessage("");
    setStatus(nextStatus);
    try {
      await ticketsApi.updateStatus(ticketId, { status: nextStatus });
      setMessage("状态已更新");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function reply() {
    setLoading(true);
    setMessage("");
    try {
      await ticketsApi.updateStatus(ticketId, { status });
      await ticketsApi.adminReply(ticketId, { body });
      setBody("");
      setMessage("状态和回复已同步");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.feedbackActions}>
      <div className={styles.feedbackActions__statusGroup}>
        <p className={styles.feedbackActions__label}>处理状态</p>
        <div className={styles.feedbackActions__statusButtons}>
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={clsx(
                styles.feedbackActions__statusButton,
                option.className,
                status === option.value && styles.feedbackActions__statusButtonActive,
              )}
              disabled={isLoading}
              onClick={() => updateStatus(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className={styles.feedbackActions__reply}>
        <span>处理说明</span>
        <textarea
          className="field min-h-20 resize-y text-sm leading-6"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="输入给用户看的处理说明，用户侧查看弹窗会展示最新一条管理员回复。"
        />
      </label>

      <div className={styles.feedbackActions__footer}>
        {message ? <p className={styles.feedbackActions__message}>{message}</p> : null}
        <button
          type="button"
          className="btn-primary"
          disabled={isLoading || !body.trim()}
          onClick={reply}
        >
          发送回复
        </button>
      </div>
    </div>
  );
}
