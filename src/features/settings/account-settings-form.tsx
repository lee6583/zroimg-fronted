"use client";

import { Eye, EyeOff, KeyRound, LockKeyhole, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  clearLocalGenerationProvider,
  getLocalGenerationProvider,
  hasUsableLocalGenerationProvider,
  saveLocalGenerationProvider,
} from "@/shared/local-generation";
import styles from "./account-settings-form.module.css";

type AccountSettingsFormProps = {
  username: string;
  email: string;
  bio: string;
};

function joinClassNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function AccountSettingsForm({ username, email, bio }: AccountSettingsFormProps) {
  const router = useRouter();
  const [profileUsername, setProfileUsername] = useState(username);
  const [profileBio, setProfileBio] = useState(bio);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(false);
  const [localBaseUrl, setLocalBaseUrl] = useState("https://api.openai.com/v1");
  const [localApiKey, setLocalApiKey] = useState("");
  const [showLocalApiKey, setShowLocalApiKey] = useState(false);
  const [localMessage, setLocalMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const config = getLocalGenerationProvider();
      setLocalEnabled(config.enabled);
      setLocalBaseUrl(config.baseUrl);
      setLocalApiKey(config.apiKey);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileLoading(true);
    setProfileMessage("");
    const formData = new FormData();
    formData.set("username", profileUsername);
    formData.set("bio", profileBio);

    const response = await fetch("/api/account/profile", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setProfileLoading(false);
    if (!response.ok) {
      setProfileMessage(data.error || "保存失败");
      return;
    }
    setProfileMessage("资料已保存");
    router.refresh();
  }

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage("");
    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
    const data = await response.json();
    setPasswordLoading(false);
    if (!response.ok) {
      setPasswordMessage(data.error || "修改密码失败");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("密码已更新");
    router.refresh();
  }

  function saveLocalProvider(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalMessage("");

    const nextConfig = {
      enabled: localEnabled,
      baseUrl: localBaseUrl,
      apiKey: localApiKey,
      updatedAt: new Date().toISOString(),
    };

    if (nextConfig.enabled && !nextConfig.apiKey.trim()) {
      setLocalMessage("启用自定义接口时需要填写 API Key");
      return;
    }

    saveLocalGenerationProvider(nextConfig);
    setLocalMessage(nextConfig.enabled ? "本地自定义接口已保存" : "已保存，当前仍使用平台模型");
  }

  function clearLocalProvider() {
    clearLocalGenerationProvider();
    setLocalEnabled(false);
    setLocalBaseUrl("https://api.openai.com/v1");
    setLocalApiKey("");
    setLocalMessage("本地自定义接口已清除");
  }

  const localProviderReady = hasUsableLocalGenerationProvider({
    enabled: localEnabled,
    baseUrl: localBaseUrl,
    apiKey: localApiKey,
    updatedAt: null,
  });

  return (
    <section className={styles.accountSettings}>
      <form onSubmit={saveProfile} className={styles.accountSettings__card}>
        <div className={styles.accountSettings__cardHeader}>
          <UserRound size={20} className={styles.accountSettings__headerIcon} />
          <h2 className={styles.accountSettings__cardTitle}>个人资料</h2>
        </div>

        <div className={styles.accountSettings__cardBody}>
          <label className={styles.accountSettings__field}>
            <span className={styles.accountSettings__fieldLabel}>用户名</span>
            <input
              className={styles.accountSettings__textInput}
              value={profileUsername}
              onChange={(event) => setProfileUsername(event.target.value)}
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
              value={profileBio}
              onChange={(event) => setProfileBio(event.target.value)}
              maxLength={200}
              placeholder="介绍一下你自己，或者写下常用的创作方向..."
            />
          </label>

          {profileMessage ? <p className={styles.accountSettings__message}>{profileMessage}</p> : null}

          <button className="btn-primary w-fit" disabled={profileLoading}>
            {profileLoading ? "保存中" : "保存修改"}
          </button>
        </div>
      </form>

      <form onSubmit={updatePassword} className={styles.accountSettings__card}>
        <div className={styles.accountSettings__cardHeader}>
          <LockKeyhole size={20} className={styles.accountSettings__headerIcon} />
          <h2 className={styles.accountSettings__cardTitle}>修改密码</h2>
        </div>

        <div className={styles.accountSettings__cardBody}>
          {[
            { label: "当前密码", value: currentPassword, onChange: setCurrentPassword, placeholder: "" },
            { label: "新密码", value: newPassword, onChange: setNewPassword, placeholder: "至少 8 位字符" },
            { label: "确认新密码", value: confirmPassword, onChange: setConfirmPassword, placeholder: "" },
          ].map((item) => (
            <label key={item.label} className={styles.accountSettings__field}>
              <span className={styles.accountSettings__fieldLabel}>{item.label}</span>
              <span className={styles.accountSettings__passwordControl}>
                <input
                  className={styles.accountSettings__passwordInput}
                  type={showPasswords ? "text" : "password"}
                  value={item.value}
                  onChange={(event) => item.onChange(event.target.value)}
                  placeholder={item.placeholder}
                  required
                  minLength={item.label === "新密码" ? 8 : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords((current) => !current)}
                  className={joinClassNames(
                    styles.accountSettings__visibilityButton,
                    showPasswords && styles.accountSettings__visibilityButtonActive,
                  )}
                  aria-label={showPasswords ? "隐藏密码" : "显示密码"}
                >
                  {showPasswords ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>
          ))}

          <div className={styles.accountSettings__note}>
            修改密码后会保留当前登录状态，并撤销其它设备上的旧会话。
          </div>

          {passwordMessage ? <p className={styles.accountSettings__message}>{passwordMessage}</p> : null}

          <button className="btn-primary w-fit" disabled={passwordLoading}>
            {passwordLoading ? "更新中" : "更新密码"}
          </button>
        </div>
      </form>

      <form onSubmit={saveLocalProvider} className={joinClassNames(styles.accountSettings__card, styles.accountSettings__wideCard)}>
        <div className={styles.accountSettings__cardHeader}>
          <KeyRound size={18} className={styles.accountSettings__headerIcon} />
          <h2 className={styles.accountSettings__cardTitle}>自定义 URL 和 API Key</h2>
        </div>

        <div className={styles.accountSettings__cardBody}>
          <p className={styles.accountSettings__statusLine}>
            当前状态：{localProviderReady ? "已配置（使用本地自定义接口）" : "未配置（使用平台模型）"}
          </p>

          <label className={styles.accountSettings__field}>
            <span className={styles.accountSettings__fieldLabel}>API Key</span>
            <span className={styles.accountSettings__passwordControl}>
              <input
                className={styles.accountSettings__passwordInput}
                type={showLocalApiKey ? "text" : "password"}
                value={localApiKey}
                onChange={(event) => setLocalApiKey(event.target.value)}
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => setShowLocalApiKey((current) => !current)}
                className={joinClassNames(
                  styles.accountSettings__visibilityButton,
                  showLocalApiKey && styles.accountSettings__visibilityButtonActive,
                )}
              >
                {showLocalApiKey ? "隐藏" : "显示"}
              </button>
            </span>
          </label>

          <label className={styles.accountSettings__field}>
            <span className={styles.accountSettings__fieldLabel}>Base URL（可选，默认 OpenAI 官方）</span>
            <input
              className={styles.accountSettings__textInput}
              value={localBaseUrl}
              onChange={(event) => setLocalBaseUrl(event.target.value)}
              placeholder="https://api.openai.com/v1"
            />
          </label>

          <label className={styles.accountSettings__switchRow}>
            <input
              type="checkbox"
              checked={localEnabled}
              onChange={(event) => setLocalEnabled(event.target.checked)}
            />
            <span>启用后，生成页将使用本地自定义接口，不扣平台积分，图片保存到当前浏览器 IndexedDB。</span>
          </label>

          {localMessage ? <p className={styles.accountSettings__message}>{localMessage}</p> : null}

          <div className={styles.accountSettings__actions}>
            <button className="btn-primary w-fit">保存</button>
            <button type="button" className="btn-secondary w-fit" onClick={clearLocalProvider}>
              清除配置
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
