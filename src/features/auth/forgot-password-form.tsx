"use client";

import { Hash, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/api/auth/email-auth";
import { getErrorMessage } from "@/utils/error";
import styles from "./auth-form.module.css";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [isSending, setSending] = useState(false);
  const [isLoading, setLoading] = useState(false);

  async function sendCode() {
    try {
      setSending(true);
      setMessage("");
      const data = await authApi.sendPasswordResetCode({ email });
      setMessageType("success");
      setMessage(data.message);
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage("两次输入的新密码不一致");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const data = await authApi.resetPassword({
        email,
        code,
        password,
        confirmPassword,
      });
      setMessageType("success");
      setMessage(data.message);
      router.push("/login");
      router.refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className={styles.authForm}>
      <div className={styles.authForm__fields}>
        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>邮箱</span>
          <span className={styles.authForm__control}>
            <Mail className={styles.authForm__icon} />
            <input
              className={styles.authForm__input}
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>验证码</span>
          <span className={styles.authForm__inlineRow}>
            <span className={`${styles.authForm__control} ${styles.authForm__controlGrow}`}>
              <Hash className={styles.authForm__icon} />
              <input
                className={styles.authForm__input}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                inputMode="numeric"
                required
              />
            </span>
            <button
              type="button"
              className={styles.authForm__secondaryButton}
              onClick={sendCode}
              disabled={isSending || !email.trim()}
            >
              {isSending ? "发送中" : "发码"}
            </button>
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>新密码</span>
          <span className={styles.authForm__control}>
            <Lock className={styles.authForm__icon} />
            <input
              className={styles.authForm__input}
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>确认新密码</span>
          <span className={styles.authForm__control}>
            <Lock className={styles.authForm__icon} />
            <input
              className={styles.authForm__input}
              type="password"
              placeholder="再次输入新密码"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              minLength={8}
              maxLength={128}
            />
          </span>
        </label>

        {message ? (
          <p
            className={`${styles.authForm__message} ${messageType === "error" ? styles.authForm__messageError : styles.authForm__messageSuccess}`}
          >
            {message}
          </p>
        ) : null}
      </div>

      <button className={styles.authForm__submit} disabled={isLoading}>
        {isLoading ? "重置中" : "重置密码"}
      </button>
    </form>
  );
}
