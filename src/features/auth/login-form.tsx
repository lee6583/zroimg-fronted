"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { SliderVerification } from "@/features/auth/slider-verification";
import styles from "./auth-form.module.css";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verified, setVerified] = useState(false);
  const [sliderToken, setSliderToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function resetSliderVerification() {
    setVerified(false);
    setSliderToken("");
  }

  async function requestSliderToken() {
    if (!email.trim()) {
      setMessage("请先输入邮箱，再完成安全验证");
      return false;
    }

    setMessage("");
    const response = await fetch("/api/auth/slider-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "安全验证失败，请重试");
      resetSliderVerification();
      return false;
    }

    setSliderToken(data.token);
    setVerified(true);
    return true;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verified || !sliderToken) {
      setMessage("请先完成安全验证");
      return;
    }
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ email, password, sliderToken }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok || result?.error) {
      resetSliderVerification();
      setMessage(result?.error?.message || result?.error || "登录失败，请重新完成安全验证");
      return;
    }
    router.push("/dashboard");
    router.refresh();
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
              onChange={(event) => {
                setEmail(event.target.value);
                resetSliderVerification();
              }}
              required
            />
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>密码</span>
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

        <div>
          <div className={styles.authForm__verificationTitle}>
            <ShieldCheck className={styles.authForm__verificationIcon} />
            <span>安全验证</span>
          </div>
          <SliderVerification verified={verified} onVerified={requestSliderToken} />
        </div>

        {message ? <p className={`${styles.authForm__message} ${styles.authForm__messageError}`}>{message}</p> : null}
      </div>

      <button className={styles.authForm__submit} disabled={loading || !verified}>
        {loading ? "登录中" : "登录"}
      </button>
    </form>
  );
}
