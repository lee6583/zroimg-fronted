"use client";

import { getErrorMessage } from "@/utils/error";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ticketsApi } from "@/api/support/tickets";
import { AppSelect } from "@/components/ui/app-select";
import { type FeedbackStatus, feedbackStatusLabels } from "@/utils/feedback";

const statusOptions = Object.entries(feedbackStatusLabels).map(([value, label]) => ({
  value: value as FeedbackStatus,
  label,
}));

export function FeedbackActions({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: FeedbackStatus;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<FeedbackStatus>(currentStatus);
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);

  async function updateStatus() {
    setLoading(true);
    setMessage("");
    try {
      await ticketsApi.updateStatus(ticketId, { status });
      setLoading(false);
      setMessage("状态已更新");
      router.refresh();
    } catch (error) {
      setLoading(false);
      setMessage(getErrorMessage(error));
      return;
    }
  }

  async function reply() {
    setLoading(true);
    setMessage("");
    try {
      await ticketsApi.adminReply(ticketId, { body });
      setLoading(false);
      setBody("");
      setMessage("回复已发送");
      router.refresh();
    } catch (error) {
      setLoading(false);
      setMessage(getErrorMessage(error));
      return;
    }
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <AppSelect
          value={status}
          onChange={setStatus}
          options={statusOptions}
          triggerClassName="min-h-10 text-sm"
        />
        <button type="button" className="btn-secondary" disabled={isLoading} onClick={updateStatus}>
          更新状态
        </button>
      </div>
      <textarea
        className="field min-h-24 resize-y text-sm leading-6"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="回复用户..."
      />
      <button
        type="button"
        className="btn-primary w-fit"
        disabled={isLoading || !body.trim()}
        onClick={reply}
      >
        发送回复
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
