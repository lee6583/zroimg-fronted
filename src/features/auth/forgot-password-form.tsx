"use client";

import { Hash, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { authApi } from "@/api/auth/email-auth";
import { translateApiError } from "@/i18n/api-error";
import { Link, useRouter } from "@/i18n/navigation";
import styles from "./auth-form.module.css";
import { PasswordInput } from "./password-input";

const defaultCodeCooldownSeconds = 60;

export function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const tCode = useTranslations("auth.code");
  const tValidation = useTranslations("auth.validation");
  const tError = useTranslations("errors.api");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [isSending, setSending] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (codeCountdown <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setCodeCountdown((currentCountdown) => {
        return Math.max(currentCountdown - 1, 0);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [codeCountdown]);

  async function sendCode() {
    if (isSending || codeCountdown > 0) {
      return;
    }

    try {
      setSending(true);
      setMessage("");
      const data = await authApi.sendPasswordResetCode({ email });
      setCodeCountdown(data.cooldownSeconds || defaultCodeCooldownSeconds);
      setMessageType("success");
      setMessage(tCode("sent"));
    } catch (error) {
      setMessageType("error");
      setMessage(translateApiError(error, tError));
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessageType("error");
      setMessage(tValidation("passwordMismatch"));
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      await authApi.resetPassword({
        email,
        code,
        password,
        confirmPassword,
      });
      setMessageType("success");
      setMessage(t("success"));
      router.push("/login");
      router.refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(translateApiError(error, tError));
    } finally {
      setLoading(false);
    }
  }

  let sendCodeText = tCode("send");
  if (isSending) {
    sendCodeText = tCode("sending");
  } else if (codeCountdown > 0) {
    sendCodeText = tCode("countdown", { seconds: codeCountdown });
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
              onChange={(event) => {
                setEmail(event.target.value);
                setCodeCountdown(0);
              }}
              autoComplete="email"
              autoCapitalize="none"
              required
            />
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>{t("code")}</span>
          <span className={styles.authForm__inlineRow}>
            <span className={`${styles.authForm__control} ${styles.authForm__controlGrow}`}>
              <Hash className={styles.authForm__icon} />
              <input
                className={styles.authForm__input}
                name="code"
                value={code}
                onChange={(event) => setCode(event.target.value.trim())}
                inputMode="numeric"
                maxLength={12}
                autoComplete="one-time-code"
                required
              />
            </span>
            <button
              type="button"
              className={styles.authForm__secondaryButton}
              onClick={sendCode}
              disabled={isSending || codeCountdown > 0 || !email.trim()}
            >
              {sendCodeText}
            </button>
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>{t("newPassword")}</span>
          <PasswordInput
            placeholder={t("newPasswordPlaceholder")}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            maxLength={128}
          />
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>{t("confirmPassword")}</span>
          <PasswordInput
            placeholder={t("confirmPasswordPlaceholder")}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            maxLength={128}
          />
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
        {isLoading ? t("submitting") : t("submit")}
      </button>

      <Link href="/login" className={styles.authForm__plainLink}>
        {t("backToLogin")}
      </Link>
    </form>
  );
}
