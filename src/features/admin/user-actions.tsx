"use client";

import clsx from "clsx";
import { Ban, CircleCheck, Coins, Eye, EyeOff, KeyRound, Pencil, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminUsersApi } from "@/api/admin/users";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { AdminUser } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import styles from "./user-actions.module.css";

type UserActionsProps = {
  user: AdminUser;
  variant?: "icon" | "button";
};

type PendingAction = "credits" | "password" | "status" | "delete" | null;

export function UserActions(props: UserActionsProps) {
  const user = props.user;
  const variant = props.variant || "icon";
  const router = useRouter();
  const canDelete = variant === "icon" && user.role !== "admin";
  const canUpdateStatus = variant === "icon" && user.role !== "admin";

  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const [amount, setAmount] = useState(100);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [statusOverride, setStatusOverride] = useState<AdminUser["status"] | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [message, setMessage] = useState("");
  const [isError, setError] = useState(false);

  useEffect(() => {
    if (!dialog) return;

    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !pendingAction) setDialog(null);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeByEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeByEscape);
    };
  }, [dialog, pendingAction]);

  function openEditDialog() {
    setMessage("");
    setError(false);
    setDialog("edit");
  }

  function openDeleteDialog() {
    setDeleteConfirmation("");
    setMessage("");
    setError(false);
    setDialog("delete");
  }

  function showError(error: unknown) {
    setError(true);
    setMessage(getErrorMessage(error));
  }

  async function adjustCredits(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isInteger(amount) || amount === 0) {
      setError(true);
      setMessage("调整数量必须是非零整数");
      return;
    }
    setPendingAction("credits");
    setMessage("");

    try {
      await adminUsersApi.adjustCredits(user.id, { amount });
      setError(false);
      setMessage("积分已调整");
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
      await adminUsersApi.resetPassword(user.id, { password });
      setPassword("");
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
    const action = nextStatus === "banned" ? "封禁" : "解除封禁";
    if (!window.confirm(`确定${action}用户“${user.username}”吗？`)) return;
    setPendingAction("status");

    try {
      await adminUsersApi.updateStatus(user.id, { status: nextStatus });
      setStatusOverride(nextStatus);
      router.refresh();
    } catch (error) {
      window.alert(getErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteUser() {
    if (deleteConfirmation !== user.username) return;
    setPendingAction("delete");
    setMessage("");

    try {
      await adminUsersApi.deleteUser(user.id);
      setDialog(null);
      router.refresh();
    } catch (error) {
      setPendingAction(null);
      showError(error);
    }
  }

  const status = statusOverride || user.status;
  const isLoading = pendingAction !== null;

  return (
    <>
      <div className={styles.userActions__buttons}>
        <button
          type="button"
          className={clsx(variant === "icon" ? styles.userActions__iconButton : "btn-secondary")}
          aria-label={`编辑用户 ${user.username}`}
          title="编辑用户"
          onClick={openEditDialog}
        >
          <Pencil size={15} />
          {variant === "button" ? <span>编辑用户</span> : null}
        </button>
        {canUpdateStatus ? (
          <button
            type="button"
            className={clsx(
              styles.userActions__iconButton,
              status === "active" && styles.userActions__banButton,
            )}
            aria-label={`${status === "active" ? "封禁" : "解除封禁"}用户 ${user.username}`}
            title={status === "active" ? "封禁用户" : "解除封禁"}
            disabled={isLoading}
            onClick={toggleStatus}
          >
            {status === "active" ? <Ban size={15} /> : <CircleCheck size={15} />}
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            className={clsx(styles.userActions__iconButton, styles.userActions__deleteButton)}
            aria-label={`删除用户 ${user.username}`}
            title="删除用户"
            onClick={openDeleteDialog}
          >
            <Trash2 size={15} />
          </button>
        ) : null}
      </div>

      {dialog === "edit" ? (
        <div
          className={styles.userActions__overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isLoading) setDialog(null);
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
                <UserAvatar name={user.username} src={user.avatarUrl} size={44} decorative />
                <div>
                  <h2 id={`edit-user-${user.id}`}>{user.username}</h2>
                  <p className={styles.userActions__identityMeta}>
                    {user.email || `用户 ID：${user.id}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={styles.userActions__closeButton}
                aria-label="关闭编辑弹窗"
                title="关闭"
                disabled={isLoading}
                onClick={() => setDialog(null)}
              >
                <X size={18} />
              </button>
            </header>

            <div className={styles.userActions__body}>
              <form className={styles.userActions__section} onSubmit={adjustCredits}>
                <div className={styles.userActions__sectionHeading}>
                  <div className={styles.userActions__sectionTitle}>
                    <span className={styles.userActions__sectionIcon} aria-hidden="true">
                      <Coins size={16} />
                    </span>
                    <div>
                      <h3>调整积分</h3>
                      <p>当前余额 {user.totalPoints.toLocaleString("zh-CN")} 积分</p>
                    </div>
                  </div>
                </div>
                <div className={styles.userActions__controls}>
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
                  <button className="btn-primary" type="submit" disabled={isLoading}>
                    {pendingAction === "credits" ? "处理中..." : "确认调整"}
                  </button>
                </div>
              </form>

              <form className={styles.userActions__section} onSubmit={resetPassword}>
                <div className={styles.userActions__sectionHeading}>
                  <div className={styles.userActions__sectionTitle}>
                    <span className={styles.userActions__sectionIcon} aria-hidden="true">
                      <KeyRound size={16} />
                    </span>
                    <div>
                      <h3>重置密码</h3>
                    </div>
                  </div>
                </div>
                <div className={styles.userActions__controls}>
                  <label>
                    <span>新密码</span>
                    <div className={styles.userActions__passwordField}>
                      <input
                        className="field"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.userActions__passwordToggle}
                        aria-label={showPassword ? "隐藏密码" : "显示密码"}
                        title={showPassword ? "隐藏密码" : "显示密码"}
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </label>
                  <button className="btn-secondary" type="submit" disabled={isLoading || !password}>
                    {pendingAction === "password" ? "处理中..." : "重置密码"}
                  </button>
                </div>
              </form>
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

      {dialog === "delete" ? (
        <div
          className={styles.userActions__overlay}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isLoading) setDialog(null);
          }}
        >
          <section
            className={styles.userActions__confirmDialog}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={`delete-user-${user.id}`}
          >
            <div className={styles.userActions__confirmIcon} aria-hidden="true">
              <Trash2 size={20} />
            </div>
            <h2 id={`delete-user-${user.id}`}>删除用户</h2>
            <p className={styles.userActions__confirmText}>
              删除后将清理该用户的资料、生成内容、反馈和媒体文件，操作无法撤销。
            </p>
            <label className={styles.userActions__confirmField}>
              <span>输入用户名确认：{user.username}</span>
              <input
                className="field"
                value={deleteConfirmation}
                autoFocus
                onChange={(event) => setDeleteConfirmation(event.target.value)}
              />
            </label>
            {message ? (
              <p className={styles.userActions__messageError} role="alert">
                {message}
              </p>
            ) : null}
            <div className={styles.userActions__confirmActions}>
              <button
                type="button"
                className="btn-secondary"
                disabled={isLoading}
                onClick={() => setDialog(null)}
              >
                取消
              </button>
              <button
                type="button"
                className={styles.userActions__dangerButton}
                disabled={isLoading || deleteConfirmation !== user.username}
                onClick={deleteUser}
              >
                {pendingAction === "delete" ? "删除中..." : "确认删除"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
