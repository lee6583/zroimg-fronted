"use client";

import { useState } from "react";

export function UserActions({ userId, status }: { userId: string; status: "active" | "banned" }) {
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("Manual adjustment");
  const [message, setMessage] = useState("");

  async function adjustCredits() {
    const response = await fetch(`/api/admin/users/${userId}/credits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, reason }),
    });
    const data = await response.json();
    setMessage(response.ok ? "已调整" : data.error || "调整失败");
    if (response.ok) window.location.reload();
  }

  async function toggleStatus() {
    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: status === "active" ? "banned" : "active" }),
    });
    const data = await response.json();
    setMessage(response.ok ? "已更新" : data.error || "更新失败");
    if (response.ok) window.location.reload();
  }

  return (
    <div className="grid gap-2 md:grid-cols-[100px_1fr_auto_auto]">
      <input className="field" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
      <input className="field" value={reason} onChange={(event) => setReason(event.target.value)} />
      <button className="btn-secondary" onClick={adjustCredits}>调整积分</button>
      <button className="btn-secondary" onClick={toggleStatus}>{status === "active" ? "封禁" : "解封"}</button>
      {message ? <p className="text-sm text-muted md:col-span-4">{message}</p> : null}
    </div>
  );
}
