"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ComponentProps } from "react";
import styles from "./auth-form.module.css";

type PasswordInputProps = Omit<ComponentProps<"input">, "type" | "className">;

/** 认证表单的密码输入框：左侧锁图标，右侧显示/隐藏切换。 */
export function PasswordInput(props: PasswordInputProps) {
  const t = useTranslations("auth.password");
  const [isVisible, setVisible] = useState(false);
  const label = isVisible ? t("hide") : t("show");

  return (
    <span className={styles.authForm__control}>
      <Lock className={styles.authForm__icon} />
      <input
        {...props}
        className={`${styles.authForm__input} ${styles.authForm__inputWithToggle}`}
        type={isVisible ? "text" : "password"}
        autoCapitalize="none"
        spellCheck={false}
      />
      <button
        type="button"
        className={styles.authForm__toggle}
        onClick={() => setVisible((value) => !value)}
        aria-label={label}
        aria-pressed={isVisible}
        title={label}
      >
        {isVisible ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
      </button>
    </span>
  );
}
