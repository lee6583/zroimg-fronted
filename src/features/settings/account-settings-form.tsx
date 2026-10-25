"use client";

import clsx from "clsx";
import {
  Camera,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { accountApi } from "@/api/account/settings";
import { UserAvatar } from "@/components/ui/user-avatar";
import { getErrorMessage } from "@/utils/error";
import { isSupportedImageType, maxImageBytes } from "@/utils/media";
import styles from "./account-settings-form.module.css";

type AccountSettingsFormProps = {
  username: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
};

type PasswordFieldKey = "current" | "next" | "confirm";

export function AccountSettingsForm(props: AccountSettingsFormProps) {
  return (
    <section className={styles.accountSettings}>
      <aside className={styles.accountSettings__sidebar}>
        <nav className={styles.accountSettings__nav} aria-label="账户设置分类">
          <a href="#profile">
            <UserRound size={16} />
            <span>个人资料</span>
          </a>
          <a href="#security">
            <ShieldCheck size={16} />
            <span>登录安全</span>
          </a>
        </nav>
      </aside>

      <div className={styles.accountSettings__content}>
        <ProfileForm {...props} />
        <PasswordForm />
      </div>
    </section>
  );
}

function ProfileForm(props: AccountSettingsFormProps) {
  const username = props.username;
  const email = props.email;
  const bio = props.bio;
  const initialAvatarUrl = props.avatarUrl;

  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(username);
  const [intro, setIntro] = useState(bio);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [isUploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isSupportedImageType(file.type)) {
      setAvatarMessage("仅支持 PNG、JPEG 和 WebP 图片");
      return;
    }
    if (file.size <= 0 || file.size > maxImageBytes) {
      setAvatarMessage("头像图片必须小于 10 MB");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreviewUrl(previewUrl);
    setAvatarMessage("");
    setUploadingAvatar(true);

    const data = new FormData();
    data.set("file", file);
    try {
      const asset = await accountApi.updateAvatar(data);
      setAvatarUrl(asset.contentUrl);
      setAvatarPreviewUrl(null);
      setAvatarMessage("头像已更新");
      router.refresh();
    } catch (error) {
      setAvatarPreviewUrl(null);
      setAvatarMessage(getErrorMessage(error));
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const data = new FormData();
    data.set("username", name);
    data.set("bio", intro);

    try {
      await accountApi.updateProfile({ username: name, bio: intro });
      setMessage("资料已保存");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form id="profile" onSubmit={save} className={styles.accountSettings__section}>
      <header className={styles.accountSettings__sectionHeader}>
        <span className={styles.accountSettings__sectionIcon}>
          <UserRound size={18} />
        </span>
        <h2>个人资料</h2>
      </header>

      <div className={styles.accountSettings__sectionBody}>
        <div className={styles.accountSettings__avatarField}>
          <div className={styles.accountSettings__avatarControl}>
            <UserAvatar name={name || username} src={avatarPreviewUrl || avatarUrl} size={80} />
            <input
              ref={fileInputRef}
              className={styles.accountSettings__fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={uploadAvatar}
            />
            <button
              type="button"
              className={styles.accountSettings__cameraButton}
              disabled={isUploadingAvatar}
              onClick={() => fileInputRef.current?.click()}
              aria-label="更换头像"
              title="更换头像"
            >
              {isUploadingAvatar ? (
                <LoaderCircle size={15} className={styles.accountSettings__spinner} />
              ) : (
                <Camera size={15} />
              )}
            </button>
          </div>
          <div className={styles.accountSettings__avatarCopy}>
            <strong>头像</strong>
            <span>支持 JPG、PNG、WebP 格式，文件不超过 10 MB</span>
            {avatarMessage ? (
              <p className={styles.accountSettings__inlineMessage} aria-live="polite">
                {avatarMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className={styles.accountSettings__fieldGrid}>
          <div className={styles.accountSettings__field}>
            <label htmlFor="account-username">用户名</label>
            <input
              id="account-username"
              className={styles.accountSettings__input}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="username"
              required
              minLength={2}
              maxLength={32}
            />
          </div>

          <div className={styles.accountSettings__field}>
            <label htmlFor="account-email">邮箱</label>
            <input
              id="account-email"
              className={styles.accountSettings__input}
              value={email}
              autoComplete="email"
              disabled
            />
          </div>
        </div>

        <div className={styles.accountSettings__field}>
          <label htmlFor="account-bio">个人简介</label>
          <textarea
            id="account-bio"
            className={styles.accountSettings__textarea}
            value={intro}
            onChange={(event) => setIntro(event.target.value)}
            maxLength={200}
            placeholder="介绍一下你自己，或者写下常用的创作方向..."
          />
          <span className={styles.accountSettings__characterCount}>{intro.length} / 200</span>
        </div>

        <div className={styles.accountSettings__formActions}>
          {message ? (
            <p className={styles.accountSettings__message} aria-live="polite">
              {message}
            </p>
          ) : (
            <span />
          )}
          <button className="btn-primary" disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle size={16} className={styles.accountSettings__spinner} />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? "保存中" : "保存资料"}
          </button>
        </div>
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
  const [visibility, setVisibility] = useState<Record<PasswordFieldKey, boolean>>({
    current: false,
    next: false,
    confirm: false,
  });

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

  function toggleVisibility(field: PasswordFieldKey) {
    setVisibility((value) => ({ ...value, [field]: !value[field] }));
  }

  const fields = [
    {
      key: "current" as const,
      id: "current-password",
      label: "当前密码",
      value: current,
      setValue: setCurrent,
      autoComplete: "current-password",
    },
    {
      key: "next" as const,
      id: "new-password",
      label: "新密码",
      value: next,
      setValue: setNext,
      autoComplete: "new-password",
    },
    {
      key: "confirm" as const,
      id: "confirm-password",
      label: "确认新密码",
      value: confirm,
      setValue: setConfirm,
      autoComplete: "new-password",
    },
  ];

  return (
    <form id="security" onSubmit={save} className={styles.accountSettings__section}>
      <header className={styles.accountSettings__sectionHeader}>
        <span className={styles.accountSettings__sectionIcon}>
          <LockKeyhole size={18} />
        </span>
        <h2>登录安全</h2>
      </header>

      <div className={styles.accountSettings__sectionBody}>
        <div className={styles.accountSettings__passwordFields}>
          {fields.map((field) => (
            <div key={field.key} className={styles.accountSettings__field}>
              <label htmlFor={field.id}>{field.label}</label>
              <span className={styles.accountSettings__passwordControl}>
                <input
                  id={field.id}
                  className={styles.accountSettings__input}
                  type={visibility[field.key] ? "text" : "password"}
                  value={field.value}
                  onChange={(event) => field.setValue(event.target.value)}
                  autoComplete={field.autoComplete}
                  placeholder={field.key === "next" ? "至少 8 位字符" : ""}
                  required
                  minLength={field.key === "next" ? 8 : undefined}
                />
                <button
                  type="button"
                  title={visibility[field.key] ? "隐藏密码" : "显示密码"}
                  onClick={() => toggleVisibility(field.key)}
                  className={clsx(
                    styles.accountSettings__visibilityButton,
                    visibility[field.key] && styles.accountSettings__visibilityButtonActive,
                  )}
                  aria-label={visibility[field.key] ? `隐藏${field.label}` : `显示${field.label}`}
                >
                  {visibility[field.key] ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.accountSettings__note}>
          <ShieldCheck size={16} />
          <span>新密码至少 8 位，且两次输入必须一致。</span>
        </div>

        <div className={styles.accountSettings__formActions}>
          {message ? (
            <p className={styles.accountSettings__message} aria-live="polite">
              {message}
            </p>
          ) : (
            <span />
          )}
          <button className="btn-primary" disabled={isSaving}>
            {isSaving ? (
              <LoaderCircle size={16} className={styles.accountSettings__spinner} />
            ) : (
              <KeyRound size={16} />
            )}
            {isSaving ? "更新中" : "更新密码"}
          </button>
        </div>
      </div>
    </form>
  );
}
