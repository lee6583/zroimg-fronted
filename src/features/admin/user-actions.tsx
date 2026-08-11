"use client";

import clsx from "clsx";
import { Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminUsersApi } from "@/api/admin/users";
import type { AdminUser } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import styles from "./user-actions.module.css";

type UserActionsProps = {
  user: AdminUser;
  variant?: "icon" | "button";
};

type PendingAction = "credits" | "password" | "status" | null;

export function UserActions(props: UserActionsProps) {
  const user = props.user;
  const variant = props.variant || "icon";
  const router = useRouter();

  const [isOpen, setOpen] = useState(false);
  const [amount, setAmount] = useState(100);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusOverride, setStatusOverride] = useState<AdminUser["status"] | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [message, setMessage] = useState("");
  const [isError, setError] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pendingAction) setOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeByEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeByEscape);
    };
  }, [isOpen, pendingAction]);

  function openDialog() {
    setMessage("");
    setError(false);
    setOpen(true);
  }

  function showError(error: unknown) {
    setError(true);
    setMessage(getErrorMessage(error));
  }

  async function adjustCredits(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("credits");
    setMessage("");

    try {
      await adminUsersApi.adjustCredits(user.id, { amount, reason });
      setError(false);
      setMessage("积分已调整");
      setReason("");
      router.refresh();
    } catch (error) {
      showError(error);
    } finally {
      setPendingAction(null);
    }
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingAction("password");
    setMessage("");

    try {
      await adminUsersApi.resetPassword(user.id, { password, confirmPassword });
      setPassword("");
      setConfirmPassword("");
      setError(false);
      setMessage("密码已重置");
    } catch (error) {
      showError(error);
    } finally {
      setPendingAction(null);
    }
  }

  async function toggleStatus() {
    const nextStatus = status === "active" ? "banned" : "active";
    setPendingAction("status");
    setMessage("");

    try {
      await adminUsersApi.updateStatus(user.id, { status: nextStatus });
      setStatusOverride(nextStatus);
      setError(false);
      setMessage(nextStatus === "active" ? "用户已解除封禁" : "用户已封禁");
      router.refresh();
    } catch (error) {
      showError(error);
    } finally {
      setPendingAction(null);
    }
  }

  const status = statusOverride || user.status;
  const isLoading = pendingAction !== null;

  return (
    <>
      <button
        type="button"
        className={clsx(variant === "icon" ? styles.userActions__iconButton : "btn-secondary")}
        aria-label={`编辑用户 ${user.username}`}
        title="编辑用户"
        onClick={openDialog}
      >
        <Pencil size={15} />
        {variant === "button" ? <span>编辑用户</span> : null}
      </button>

      {isOpen ? (
        <div
          className={styles.userActions__overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isLoading) setOpen(false);
          }}
        >
          <section
            className={styles.userActions__dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-user-${user.id}`}
          >
            <header className={styles.userActions__header}>
              <div className={styles.userActions__identity}>
                <span className={styles.userActions__avatar} aria-hidden="true">
                  {user.username.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <h2 id={`edit-user-${user.id}`}>{user.username}</h2>
                  <p>{user.email || `用户 ID：${user.id}`}</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.userActions__iconButton}
                aria-label="关闭编辑弹窗"
                title="关闭"
                disabled={isLoading}
                onClick={() => setOpen(false)}
              >
                <X size={16} />
              </button>
            </header>

            <div className={styles.userActions__body}>
              <form className={styles.userActions__section} onSubmit={adjustCredits}>
                <div className={styles.userActions__sectionHeading}>
                  <div>
                    <h3>调整积分</h3>
                    <p>当前余额 {user.totalPoints.toLocaleString("zh-CN")} 积分</p>
                  </div>
                  <button
                    className="btn-primary"
                    type="submit"
                    disabled={isLoading || !reason.trim()}
                  >
                    {pendingAction === "credits" ? "处理中..." : "确认调整"}
                  </button>
                </div>
                <div className={styles.userActions__fields}>
                  <label>
                    <span>调整数量</span>
                    <input
                      className="field"
                      type="number"
                      required
                      value={amount}
                      onChange={(event) => setAmount(Number(event.target.value))}
                    />
                  </label>
                  <label>
                    <span>调整原因</span>
                    <input
                      className="field"
                      required
                      value={reason}
                      placeholder="填写操作原因"
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </label>
                </div>
              </form>

              <form className={styles.userActions__section} onSubmit={resetPassword}>
                <div className={styles.userActions__sectionHeading}>
                  <div>
                    <h3>重置密码</h3>
                  </div>
                  <button
                    className="btn-secondary"
                    type="submit"
                    disabled={isLoading || !password || !confirmPassword}
                  >
                    {pendingAction === "password" ? "处理中..." : "重置密码"}
                  </button>
                </div>
                <div className={styles.userActions__fields}>
                  <label>
                    <span>新密码</span>
                    <input
                      className="field"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                  <label>
                    <span>确认新密码</span>
                    <input
                      className="field"
                      type="password"
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </label>
                </div>
              </form>

              <section className={styles.userActions__statusSection}>
                <div>
                  <h3>{status === "active" ? "封禁用户" : "解除封禁"}</h3>
                  <p>
                    {status === "active"
                      ? "封禁后用户将无法继续使用账户。"
                      : "解除后用户可以恢复正常使用。"}
                  </p>
                </div>
                <button
                  type="button"
                  className={clsx(
                    styles.userActions__statusButton,
                    status === "active" && styles.userActions__statusButtonDanger,
                  )}
                  disabled={isLoading}
                  onClick={toggleStatus}
                >
                  {pendingAction === "status"
                    ? "处理中..."
                    : status === "active"
                      ? "封禁用户"
                      : "解除封禁"}
                </button>
              </section>
            </div>

            {message ? (
              <p
                className={clsx(
                  styles.userActions__message,
                  isError && styles.userActions__messageError,
                )}
                role="status"
              >
                {message}
              </p>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
