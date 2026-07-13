"use client";

import clsx from "clsx";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import { accountApi } from "@/api/account/settings";
import { getErrorMessage } from "@/utils/error";
import styles from "./account-settings-form.module.css";

type AccountSettingsFormProps = {
  username: string;
  email: string;
  bio: string;
};

export function AccountSettingsForm(props: AccountSettingsFormProps) {
  return (
    <section className={styles.accountSettings}>
      <ProfileForm {...props} />
      <PasswordForm />
    </section>
  );
}

function ProfileForm(props: AccountSettingsFormProps) {
  const username = props.username;
  const email = props.email;
  const bio = props.bio;

  const router = useRouter();
  const [name, setName] = useState(username);
  const [intro, setIntro] = useState(bio);
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const data = new FormData();
    data.set("username", name);
    data.set("bio", intro);

    try {
      await accountApi.updateProfile(data);
      setMessage("资料已保存");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className={styles.accountSettings__card}>
      <div className={styles.accountSettings__cardHeader}>
        <UserRound size={20} className={styles.accountSettings__headerIcon} />
        <h2 className={styles.accountSettings__cardTitle}>个人资料</h2>
      </div>

      <div className={styles.accountSettings__cardBody}>
        <label className={styles.accountSettings__field}>
          <span className={styles.accountSettings__fieldLabel}>用户名</span>
          <input
            className={styles.accountSettings__textInput}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={32}
          />
        </label>

        <label className={styles.accountSettings__field}>
          <span className={styles.accountSettings__fieldLabel}>邮箱</span>
          <input className={styles.accountSettings__emailInput} value={email} disabled />
          <span className={styles.accountSettings__fieldHint}>邮箱注册后暂不支持自行修改。</span>
        </label>

        <label className={styles.accountSettings__field}>
          <span className={styles.accountSettings__fieldLabel}>个人简介</span>
          <textarea
            className={styles.accountSettings__textarea}
            value={intro}
            onChange={(event) => setIntro(event.target.value)}
            maxLength={200}
            placeholder="介绍一下你自己，或者写下常用的创作方向..."
          />
        </label>

        {message ? <p className={styles.accountSettings__message}>{message}</p> : null}

        <button className="btn-primary w-fit" disabled={isSaving}>
          {isSaving ? "保存中" : "保存修改"}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [isVisible, setVisible] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await accountApi.updatePassword({
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      });
      setCurrent("");
      setNext("");
      setConfirm("");
      setMessage("密码已更新");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const fields = [
    { label: "当前密码", value: current, setValue: setCurrent },
    { label: "新密码", value: next, setValue: setNext },
    { label: "确认新密码", value: confirm, setValue: setConfirm },
  ];

  return (
    <form onSubmit={save} className={styles.accountSettings__card}>
      <div className={styles.accountSettings__cardHeader}>
        <LockKeyhole size={20} className={styles.accountSettings__headerIcon} />
        <h2 className={styles.accountSettings__cardTitle}>修改密码</h2>
      </div>

      <div className={styles.accountSettings__cardBody}>
        {fields.map((field) => (
          <label key={field.label} className={styles.accountSettings__field}>
            <span className={styles.accountSettings__fieldLabel}>{field.label}</span>
            <span className={styles.accountSettings__passwordControl}>
              <input
                className={styles.accountSettings__passwordInput}
                type={isVisible ? "text" : "password"}
                value={field.value}
                onChange={(event) => field.setValue(event.target.value)}
                placeholder={field.label === "新密码" ? "至少 8 位字符" : ""}
                required
                minLength={field.label === "新密码" ? 8 : undefined}
              />
              <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                className={clsx(
                  styles.accountSettings__visibilityButton,
                  isVisible && styles.accountSettings__visibilityButtonActive,
                )}
                aria-label={isVisible ? "隐藏密码" : "显示密码"}
              >
                {isVisible ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </label>
        ))}

        <div className={styles.accountSettings__note}>新密码至少 8 位，且两次输入必须一致。</div>

        {message ? <p className={styles.accountSettings__message}>{message}</p> : null}

        <button className="btn-primary w-fit" disabled={isSaving}>
          {isSaving ? "更新中" : "更新密码"}
        </button>
      </div>
    </form>
  );
}
