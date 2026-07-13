"use client";

import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { authApi } from "@/api/auth/email-auth";
import styles from "./auth-form.module.css";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      setLoading(true);
      setMessage("");
      const data = await authApi.loginWithEmail({ email, password });
      setLoading(false);

      const role = data.role || data.user?.role;
      const redirectTo = data.redirectTo || (role === "admin" ? "/admin" : "/dashboard");
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setLoading(false);
      setMessage(getErrorMessage(error));
      return;
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
          <span className={styles.authForm__labelRow}>
            <span className={styles.authForm__fieldLabel}>密码</span>
            <Link href="/forgot-password" className={styles.authForm__fieldLink}>
              忘记密码？
            </Link>
          </span>
          <span className={styles.authForm__control}>
            <Lock className={styles.authForm__icon} />
            <input
              className={styles.authForm__input}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </span>
        </label>

        {message ? (
          <p className={`${styles.authForm__message} ${styles.authForm__messageError}`}>
            {message}
          </p>
        ) : null}
      </div>

      <button className={styles.authForm__submit} disabled={isLoading}>
        {isLoading ? "登录中" : "登录"}
      </button>
    </form>
  );
}
