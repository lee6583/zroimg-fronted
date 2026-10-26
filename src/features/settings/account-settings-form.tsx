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
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { accountApi } from "@/api/account/settings";
import { UserAvatar } from "@/components/ui/user-avatar";
import { useTranslations } from "next-intl";
import { translateApiError } from "@/i18n/api-error";
import { useRouter } from "@/i18n/navigation";
import { isSupportedImageType, maxImageBytes } from "@/utils/media";
import styles from "./account-settings-form.module.css";

type AccountSettingsFormProps = {
  username: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
};

type PasswordFieldKey = "current" | "next" | "confirm";

const maxImageMb = Math.round(maxImageBytes / 1024 / 1024);
const maxBioLength = 200;

export function AccountSettingsForm(props: AccountSettingsFormProps) {
  const t = useTranslations("settings.nav");

  return (
    <section className={styles.accountSettings}>
      <aside className={styles.accountSettings__sidebar}>
        <nav className={styles.accountSettings__nav} aria-label={t("label")}>
          <a href="#profile">
            <UserRound size={16} />
            <span>{t("profile")}</span>
          </a>
          <a href="#security">
            <ShieldCheck size={16} />
            <span>{t("security")}</span>
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

  const t = useTranslations("settings.profile");
  const tUpload = useTranslations("errors.upload");
  const tError = useTranslations("errors.api");
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
      setAvatarMessage(tUpload("unsupportedImageType"));
      return;
    }
    if (file.size <= 0 || file.size > maxImageBytes) {
      setAvatarMessage(tUpload("imageTooLarge", { maxMb: maxImageMb }));
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
      setAvatarMessage(t("avatarUpdated"));
      router.refresh();
    } catch (error) {
      setAvatarPreviewUrl(null);
      setAvatarMessage(translateApiError(error, tError));
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await accountApi.updateProfile({ username: name, bio: intro });
      setMessage(t("saved"));
      router.refresh();
    } catch (error) {
      setMessage(translateApiError(error, tError));
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
        <h2>{t("title")}</h2>
      </header>

      <div className={styles.accountSettings__sectionBody}>
        <div className={styles.accountSettings__avatarField}>
          <button
            type="button"
            className={styles.accountSettings__avatarControl}
            disabled={isUploadingAvatar}
            onClick={() => fileInputRef.current?.click()}
            aria-label={t("changeAvatar")}
            title={t("changeAvatar")}
          >
            <UserAvatar
              name={name || username}
              src={avatarPreviewUrl || avatarUrl}
              size={80}
              decorative
            />
            <span className={styles.accountSettings__cameraButton} aria-hidden>
              {isUploadingAvatar ? (
                <LoaderCircle size={15} className={styles.accountSettings__spinner} />
              ) : (
                <Camera size={15} />
              )}
            </span>
          </button>
          <div className={styles.accountSettings__avatarCopy}>
            <input
              ref={fileInputRef}
              className={styles.accountSettings__fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={uploadAvatar}
            />
            <strong>{t("avatar")}</strong>
            <span>{t("avatarHint")}</span>
            {avatarMessage ? (
              <p className={styles.accountSettings__inlineMessage} aria-live="polite">
                {avatarMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className={styles.accountSettings__fieldGrid}>
          <div className={styles.accountSettings__field}>
            <label htmlFor="account-username">{t("username")}</label>
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
            <label htmlFor="account-email">{t("email")}</label>
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
          <label htmlFor="account-bio">{t("bio")}</label>
          <textarea
            id="account-bio"
            className={styles.accountSettings__textarea}
            value={intro}
            onChange={(event) => setIntro(event.target.value)}
            maxLength={maxBioLength}
            placeholder={t("bioPlaceholder")}
          />
          <span className={styles.accountSettings__characterCount}>
            {t("bioCount", { count: intro.length, max: maxBioLength })}
          </span>
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
            {isSaving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </form>
  );
}

function PasswordForm() {
  const t = useTranslations("settings.security");
  const tError = useTranslations("errors.api");
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
      setMessage(t("updated"));
      router.refresh();
    } catch (error) {
      setMessage(translateApiError(error, tError));
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
      label: t("currentPassword"),
      value: current,
      setValue: setCurrent,
      autoComplete: "current-password",
    },
    {
      key: "next" as const,
      id: "new-password",
      label: t("newPassword"),
      value: next,
      setValue: setNext,
      autoComplete: "new-password",
    },
    {
      key: "confirm" as const,
      id: "confirm-password",
      label: t("confirmPassword"),
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
        <h2>{t("title")}</h2>
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
                  placeholder={field.key === "next" ? t("newPasswordPlaceholder") : ""}
                  required
                  minLength={field.key === "next" ? 8 : undefined}
                />
                <button
                  type="button"
                  title={visibility[field.key] ? t("hidePassword") : t("showPassword")}
                  onClick={() => toggleVisibility(field.key)}
                  className={clsx(
                    styles.accountSettings__visibilityButton,
                    visibility[field.key] && styles.accountSettings__visibilityButtonActive,
                  )}
                  aria-label={
                    visibility[field.key]
                      ? t("hideField", { field: field.label })
                      : t("showField", { field: field.label })
                  }
                >
                  {visibility[field.key] ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </div>
          ))}
        </div>

        <div className={styles.accountSettings__note}>
          <ShieldCheck size={16} />
          <span>{t("note")}</span>
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
            {isSaving ? t("submitting") : t("submit")}
          </button>
        </div>
      </div>
    </form>
  );
}
