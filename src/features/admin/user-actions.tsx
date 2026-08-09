"use client";

import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { adminUsersApi } from "@/api/admin/users";

type UserActionsProps = {
  userId: string;
  status: "active" | "banned";
};

export function UserActions(props: UserActionsProps) {
  const userId = props.userId;
  const status = props.status;

  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("Manual adjustment");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  async function resetPassword() {
    try {
      await adminUsersApi.resetPassword(userId, { password, confirmPassword });
      setPassword("");
      setConfirmPassword("");
      setMessage("密码已重置");
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
      <input
        className="field"
        type="password"
        placeholder="新密码"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <input
        className="field"
        type="password"
        placeholder="确认新密码"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />
      <button className="btn-secondary" type="button" onClick={resetPassword}>
        重置密码
      </button>
      {message ? <p className="text-sm text-muted md:col-span-4">{message}</p> : null}
    </div>
  );
}
