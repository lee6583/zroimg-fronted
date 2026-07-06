"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppSelect } from "@/components/app-select";
import { type FeedbackStatus, feedbackStatusLabels } from "@/shared/feedback";

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
  const [loading, setLoading] = useState(false);

  async function updateStatus() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/tickets/${ticketId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error || "更新状态失败");
      return;
    }
    setMessage("状态已更新");
    router.refresh();
  }

  async function reply() {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/tickets/${ticketId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error || "回复失败");
      return;
    }
    setBody("");
    setMessage("回复已发送");
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <AppSelect value={status} onChange={setStatus} options={statusOptions} triggerClassName="min-h-10 text-sm" />
        <button type="button" className="btn-secondary" disabled={loading} onClick={updateStatus}>
          更新状态
        </button>
      </div>
      <textarea
        className="field min-h-24 resize-y text-sm leading-6"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="回复用户..."
      />
      <button type="button" className="btn-primary w-fit" disabled={loading || !body.trim()} onClick={reply}>
        发送回复
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
