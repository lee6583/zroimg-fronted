"use client";

import { useEffect, useRef, useState } from "react";
import { Gift, Hash, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { Messages } from "next-intl";
import { useTranslations } from "next-intl";
import { authApi } from "@/api/auth/email-auth";
import { SliderVerification } from "@/features/auth/slider-verification";
import { translateApiError } from "@/i18n/api-error";
import { useRouter } from "@/i18n/navigation";
import styles from "./auth-form.module.css";
import { PasswordInput } from "./password-input";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const codePattern = /^[0-9]{6}$/;
const defaultCodeCooldownSeconds = 60;

type RegisterFields = {
  username: string;
  email: string;
  password: string;
  code: string;
};

type ValidationKey = keyof Messages["auth"]["validation"];

type SliderChallenge = {
  challengeId: string;
  targetRatio: number;
};

function getEmailError(value: string): ValidationKey | "" {
  const email = value.trim();

  if (!email) {
    return "emailRequired";
  }

  if (email.length > 254) {
    return "emailTooLong";
  }

  if (!emailPattern.test(email)) {
    return "emailInvalid";
  }

  return "";
}

function getFormError(fields: RegisterFields): ValidationKey | "" {
  const username = fields.username.trim();
  if (username.length < 2 || username.length > 32) {
    return "usernameLength";
  }

  const emailError = getEmailError(fields.email);
  if (emailError) {
    return emailError;
  }

  const passwordLength = fields.password.length;
  if (passwordLength < 8 || passwordLength > 128) {
    return "passwordLength";
  }

  const code = fields.code.trim();
  if (!codePattern.test(code)) {
    return "codeInvalid";
  }

  return "";
}

export function RegisterForm() {
  const t = useTranslations("auth.register");
  const tCode = useTranslations("auth.code");
  const tValidation = useTranslations("auth.validation");
  const tError = useTranslations("errors.api");
  const router = useRouter();
  const emailRef = useRef("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isVerified, setVerified] = useState(false);
  const [sliderChallenge, setSliderChallenge] = useState<SliderChallenge | null>(null);
  const [sliderToken, setSliderToken] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [isSendingCode, setSendingCode] = useState(false);
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

  function resetSliderVerification() {
    setVerified(false);
    setSliderChallenge(null);
    setSliderToken("");
  }

  async function requestSliderChallenge() {
    const emailError = getEmailError(email);
    if (emailError) {
      setMessageType("error");
      setMessage(tValidation(emailError));
      return false;
    }

    const targetEmail = email.trim().toLowerCase();

    try {
      setMessage("");
      const data = await authApi.getSliderChallenge({ email: targetEmail, scene: "register" });
      const currentEmail = emailRef.current.trim().toLowerCase();
      if (currentEmail !== targetEmail) {
        return false;
      }

      setSliderChallenge(data);
      return data.targetRatio;
    } catch (error) {
      const currentEmail = emailRef.current.trim().toLowerCase();
      if (currentEmail !== targetEmail) {
        return false;
      }

      setMessageType("error");
      setMessage(translateApiError(error, tError));
      resetSliderVerification();
      return false;
    }
  }

  async function requestSliderToken(proof: { positionRatio: number; durationMs: number }) {
    if (!sliderChallenge) {
      return false;
    }

    const targetEmail = email.trim().toLowerCase();
    try {
      setMessage("");
      const data = await authApi.getSliderToken({
        email: targetEmail,
        scene: "register",
        challengeId: sliderChallenge.challengeId,
        positionRatio: proof.positionRatio,
        durationMs: proof.durationMs,
      });
      const currentEmail = emailRef.current.trim().toLowerCase();
      if (currentEmail !== targetEmail) {
        return false;
      }

      setSliderToken(data.sliderToken);
      setVerified(true);
      return true;
    } catch (error) {
      setMessageType("error");
      setMessage(translateApiError(error, tError));
      resetSliderVerification();
      return false;
    }
  }

  async function sendCode() {
    if (isSendingCode || codeCountdown > 0) {
      return;
    }

    const emailError = getEmailError(email);
    if (emailError) {
      setMessageType("error");
      setMessage(tValidation(emailError));
      return;
    }

    if (!isVerified || !sliderToken) {
      setMessageType("error");
      setMessage(tValidation("verificationRequired"));
      return;
    }

    try {
      setSendingCode(true);
      setMessage("");
      const normalizedEmail = email.trim().toLowerCase();
      const data = await authApi.sendRegisterCode({ email: normalizedEmail, sliderToken });
      setCodeCountdown(data.cooldownSeconds || defaultCodeCooldownSeconds);
      setMessageType("success");
      setMessage(tCode("sent"));
    } catch (error) {
      setMessageType("error");
      setMessage(translateApiError(error, tError));
    } finally {
      setSendingCode(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formError = getFormError({ username, email, password, code });
    if (formError) {
      setMessageType("error");
      setMessage(tValidation(formError));
      return;
    }

    if (!isVerified || !sliderToken) {
      setMessageType("error");
      setMessage(tValidation("verificationRequired"));
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      await authApi.registerAccount({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password,
        code: code.trim(),
      });
      router.push("/login");
    } catch (error) {
      setMessageType("error");
      setMessage(translateApiError(error, tError));
    } finally {
      setLoading(false);
    }
  }

  let sendCodeText = tCode("send");
  if (isSendingCode) {
    sendCodeText = tCode("sending");
  } else if (codeCountdown > 0) {
    sendCodeText = tCode("countdown", { seconds: codeCountdown });
  }

  return (
    <form onSubmit={onSubmit} className={styles.authForm}>
      <div className={styles.authForm__fields}>
        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>{t("username")}</span>
          <span className={styles.authForm__control}>
            <UserRound className={styles.authForm__icon} />
            <input
              className={styles.authForm__input}
              name="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={2}
              maxLength={32}
              autoComplete="username"
              required
            />
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>{t("email")}</span>
          <span className={styles.authForm__control}>
            <Mail className={styles.authForm__icon} />
            <input
              className={styles.authForm__input}
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => {
                const nextEmail = event.target.value;
                emailRef.current = nextEmail;
                setEmail(nextEmail);
                setCode("");
                setCodeCountdown(0);
                setMessage("");
                resetSliderVerification();
              }}
              maxLength={254}
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
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                autoComplete="one-time-code"
                required
              />
            </span>
            <button
              type="button"
              className={styles.authForm__secondaryButton}
              onClick={sendCode}
              disabled={isSendingCode || codeCountdown > 0}
            >
              {sendCodeText}
            </button>
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>{t("password")}</span>
          <PasswordInput
            name="password"
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
          />
        </label>

        <div>
          <div className={styles.authForm__verificationTitle}>
            <ShieldCheck className={styles.authForm__verificationIcon} />
            <span>{t("verification")}</span>
          </div>
          <SliderVerification
            key={email}
            verified={isVerified}
            onStart={requestSliderChallenge}
            onVerified={requestSliderToken}
          />
        </div>

        {message ? (
          <p
            className={`${styles.authForm__message} ${messageType === "error" ? styles.authForm__messageError : styles.authForm__messageSuccess}`}
          >
            {message}
          </p>
        ) : null}
      </div>

      <button className={styles.authForm__submit} disabled={isLoading || !isVerified}>
        {isLoading ? t("submitting") : t("submit")}
      </button>

      <div className={styles.authForm__reward}>
        <Gift className={styles.authForm__rewardIcon} />
        <div>
          <p className={styles.authForm__rewardTitle}>{t("rewardTitle")}</p>
          <p className={styles.authForm__rewardText}>{t("rewardText")}</p>
        </div>
      </div>
    </form>
  );
}
