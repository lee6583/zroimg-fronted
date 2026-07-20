"use client";

import { authApi } from "@/api/auth/email-auth";
import { getErrorMessage } from "@/utils/error";
import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./auth-form.module.css";

const LOGIN_COOLDOWN_MS = 1500;

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isCoolingDown, setCoolingDown] = useState(false);
  const cooldownUntilRef = useRef(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  function startCooldown() {
    cooldownUntilRef.current = Date.now() + LOGIN_COOLDOWN_MS;
    setCoolingDown(true);

    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setTimeout(() => {
      setCoolingDown(false);
      cooldownTimerRef.current = null;
    }, LOGIN_COOLDOWN_MS);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isInCooldown = Date.now() < cooldownUntilRef.current;
    if (isLoading || isCoolingDown || isInCooldown) {
      return;
    }

    startCooldown();

    try {
      setLoading(true);
      setMessage("");
      const data = await authApi.loginWithEmail({ email, password });
      const role = data.role || data.user?.role;
      const redirectTo = data.redirectTo || (role === "admin" ? "/admin" : "/dashboard");

      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const isSubmitDisabled = isLoading || isCoolingDown;
  let submitText = "登录";
  if (isLoading) {
    submitText = "登录中...";
  } else if (isCoolingDown) {
    submitText = "请稍候...";
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

      <button className={styles.authForm__submit} disabled={isSubmitDisabled}>
        {submitText}
      </button>
    </form>
  );
}
