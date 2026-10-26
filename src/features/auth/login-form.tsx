"use client";

import { authApi } from "@/api/auth/email-auth";
import { translateApiError } from "@/i18n/api-error";
import { Link, useRouter } from "@/i18n/navigation";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter as useAppRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import styles from "./auth-form.module.css";
import { PasswordInput } from "./password-input";

const LOGIN_COOLDOWN_MS = 1500;

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tError = useTranslations("errors.api");
  const router = useRouter();
  // 后台 /admin 不带语言前缀，用 Next 原生 router 跳转，避免被加上 /en、/ru。
  const appRouter = useAppRouter();
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

      if (data.user.role === "admin") {
        appRouter.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (error) {
      setMessage(translateApiError(error, tError));
    } finally {
      setLoading(false);
    }
  }

  const isSubmitDisabled = isLoading || isCoolingDown;
  let submitText = t("submit");
  if (isLoading) {
    submitText = t("submitting");
  } else if (isCoolingDown) {
    submitText = t("coolingDown");
  }

  return (
    <form onSubmit={onSubmit} className={styles.authForm}>
      <div className={styles.authForm__fields}>
        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>{t("email")}</span>
          <span className={styles.authForm__control}>
            <Mail className={styles.authForm__icon} />
            <input
              className={styles.authForm__input}
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              required
            />
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__labelRow}>
            <span className={styles.authForm__fieldLabel}>{t("password")}</span>
            <Link href="/forgot-password" className={styles.authForm__fieldLink}>
              {t("forgotPassword")}
            </Link>
          </span>
          <PasswordInput
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
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
