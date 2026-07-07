"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, Hash, Lock, Mail, ShieldCheck, UserRound } from "lucide-react";
import { getSliderToken, registerAccount, sendRegisterCode } from "@/api/auth";
import { SliderVerification } from "@/features/auth/slider-verification";
import styles from "./auth-form.module.css";

export function RegisterForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [sliderToken, setSliderToken] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  function resetSliderVerification() {
    setVerified(false);
    setSliderToken("");
  }

  async function requestSliderToken() {
    if (!email.trim()) {
      setMessageType("error");
      setMessage("请先输入邮箱，再完成安全验证");
      return false;
    }

    try {
      setMessage("");
      const data = await getSliderToken({ email, scene: "register" });
      setSliderToken(data.sliderToken || data.token || "");
      setVerified(true);
      return true;
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "安全验证失败，请重试");
      resetSliderVerification();
      return false;
    }
  }

  async function sendCode() {
    if (!verified || !sliderToken) {
      setMessageType("error");
      setMessage("请先完成安全验证");
      return;
    }

    try {
      setMessage("");
      const data = await sendRegisterCode({ email, sliderToken });
      setMessageType("success");
      setMessage(data.message || "验证码已发送");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "发送失败");
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!verified) {
      setMessageType("error");
      setMessage("请先完成安全验证");
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      await registerAccount({ username, email, password, code });
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "注册失败");
      return;
    }

    router.push("/login");
  }

  return (
    <form onSubmit={onSubmit} className={styles.authForm}>
      <div className={styles.authForm__reward}>
        <Gift className={styles.authForm__rewardIcon} />
        <div>
          <p className={styles.authForm__rewardTitle}>注册即送 10 积分</p>
          <p className={styles.authForm__rewardText}>首次注册自动到账，立即开始创作。</p>
        </div>
      </div>

      <div className={styles.authForm__fields}>
        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>用户名</span>
          <span className={styles.authForm__control}>
            <UserRound className={styles.authForm__icon} />
            <input
              className={styles.authForm__input}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>邮箱</span>
          <span className={styles.authForm__inlineRow}>
            <span className={`${styles.authForm__control} ${styles.authForm__controlGrow}`}>
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
            <button type="button" className={styles.authForm__secondaryButton} onClick={sendCode}>
              发码
            </button>
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>验证码</span>
          <span className={styles.authForm__control}>
            <Hash className={styles.authForm__icon} />
            <input
              className={styles.authForm__input}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              required
            />
          </span>
        </label>

        <label className={styles.authForm__field}>
          <span className={styles.authForm__fieldLabel}>设置密码</span>
          <span className={styles.authForm__control}>
            <Lock className={styles.authForm__icon} />
            <input
              className={styles.authForm__input}
              type="password"
              placeholder="至少 6 位"
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

        {message ? (
          <p className={`${styles.authForm__message} ${messageType === "error" ? styles.authForm__messageError : styles.authForm__messageSuccess}`}>
            {message}
          </p>
        ) : null}
      </div>

      <button className={styles.authForm__submit} disabled={loading || !verified}>
        {loading ? "注册中" : "注册"}
      </button>
    </form>
  );
}
