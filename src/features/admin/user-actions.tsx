"use client";

import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { adminUsersApi } from "@/api/admin/users";

export function UserActions({ userId, status }: { userId: string; status: "active" | "banned" }) {
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("Manual adjustment");
  const [message, setMessage] = useState("");

  async function adjustCredits() {
    try {
      await adminUsersApi.adjustCredits(userId, { amount, reason });
      setMessage("已调整");
      window.location.reload();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function toggleStatus() {
    try {
      await adminUsersApi.updateStatus(userId, {
        status: status === "active" ? "banned" : "active",
      });
      setMessage("已更新");
      window.location.reload();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-2 md:grid-cols-[100px_1fr_auto_auto]">
      <input
        className="field"
        type="number"
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value))}
      />
      <input className="field" value={reason} onChange={(event) => setReason(event.target.value)} />
      <button className="btn-secondary" onClick={adjustCredits}>
        调整积分
      </button>
      <button className="btn-secondary" onClick={toggleStatus}>
        {status === "active" ? "封禁" : "解封"}
      </button>
      {message ? <p className="text-sm text-muted md:col-span-4">{message}</p> : null}
    </div>
  );
}
