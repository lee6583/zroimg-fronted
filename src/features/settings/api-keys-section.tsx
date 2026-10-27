"use client";

import clsx from "clsx";
import {
  BookOpen,
  Check,
  Copy,
  KeyRound,
  LoaderCircle,
  Plus,
  RotateCw,
  TriangleAlert,
} from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { apiKeysApi } from "@/api/account/api-keys";
import { Sheet } from "@/components/ui/sheet";
import tableStyles from "@/components/ui/data-table.module.css";
import { ConfirmSheet } from "@/features/history/confirm-sheet";
import { translateApiError } from "@/i18n/api-error";
import { Link } from "@/i18n/navigation";
import type { ApiKey, ApiKeyExpiryDays, CreateApiKeyResponse } from "@/types/api-keys";
import { parseJavaDateTime } from "@/utils/java-time";
import formStyles from "./account-settings-form.module.css";
import styles from "./api-keys-section.module.css";

type ExpiryOption = "never" | "30" | "90" | "365";

type KeyState = "active" | "expired" | "revoked";

const maxActiveKeys = 10;
const maxNameLength = 50;
const expiryOptions: ExpiryOption[] = ["never", "30", "90", "365"];

function toExpiryDays(option: ExpiryOption): ApiKeyExpiryDays | null {
  if (option === "30") return 30;
  if (option === "90") return 90;
  if (option === "365") return 365;

  return null;
}

/** 账户设置里的「API 密钥」分区：列表、创建（完整密钥只显示一次）和吊销。 */
export function ApiKeysSection() {
  const t = useTranslations("settings.apiKeys");
  const tError = useTranslations("errors.api");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });

  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<{ name: string; expiry: ExpiryOption }>({
    name: "",
    expiry: "90",
  });
  const [isCreating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [isRevoking, setRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState("");

  const load = useCallback(async () => {
    setLoadError("");
    try {
      const list = await apiKeysApi.list();
      setKeys(list);
    } catch (error) {
      setLoadError(translateApiError(error, tError));
    }
  }, [tError]);

  useEffect(() => {
    let isActive = true;

    apiKeysApi
      .list()
      .then((list) => {
        if (isActive) setKeys(list);
      })
      .catch((error: unknown) => {
        if (isActive) setLoadError(translateApiError(error, tError));
      });

    return () => {
      isActive = false;
    };
  }, [tError]);

  function stateOf(key: ApiKey): KeyState {
    if (key.status === "revoked") return "revoked";
    if (key.expiresAt && parseJavaDateTime(key.expiresAt).getTime() <= now.getTime()) {
      return "expired";
    }

    return "active";
  }

  function formatTime(value: string | null, emptyLabel: string) {
    if (!value) return emptyLabel;

    return format.dateTime(parseJavaDateTime(value), "datetime");
  }

  // 上限只统计有效密钥（未吊销且未过期），与 Java 的规则一致。
  const activeCount = (keys ?? []).filter((key) => stateOf(key) === "active").length;
  const isAtLimit = activeCount >= maxActiveKeys;

  function openCreate() {
    setForm({ name: "", expiry: "90" });
    setCreateError("");
    setCreatedKey(null);
    setCreateOpen(true);
  }

  function closeCreate() {
    setCreateOpen(false);
    setCreatedKey(null);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setCreateError(t("create.nameRequired"));
      return;
    }

    setCreating(true);
    setCreateError("");
    try {
      const created = await apiKeysApi.create({ name, expiresInDays: toExpiryDays(form.expiry) });
      setCreatedKey(created);
      await load();
    } catch (error) {
      setCreateError(translateApiError(error, tError));
    } finally {
      setCreating(false);
    }
  }

  async function revoke() {
    if (!revokeTarget) return;

    setRevoking(true);
    setRevokeError("");
    try {
      await apiKeysApi.revoke(revokeTarget.id);
      setRevokeTarget(null);
      await load();
    } catch (error) {
      setRevokeError(translateApiError(error, tError));
    } finally {
      setRevoking(false);
    }
  }

  function renderStatus(key: ApiKey) {
    const state = stateOf(key);

    return (
      <span className={clsx(styles.apiKeys__status, styles[`apiKeys__status_${state}`])}>
        {t(`status.${state}`)}
      </span>
    );
  }

  function renderRevokeButton(key: ApiKey) {
    if (key.status === "revoked") {
      return null;
    }

    return (
      <button
        type="button"
        className={styles.apiKeys__revoke}
        onClick={() => {
          setRevokeError("");
          setRevokeTarget(key);
        }}
        aria-label={t("revoke.labelFor", { name: key.name })}
      >
        {t("revoke.action")}
      </button>
    );
  }

  function renderList() {
    if (loadError) {
      return (
        <div className={styles.apiKeys__error} role="alert">
          <span>{loadError}</span>
          <button type="button" className="btn-secondary" onClick={() => void load()}>
            <RotateCw size={15} aria-hidden />
            {t("retry")}
          </button>
        </div>
      );
    }

    if (!keys) {
      return (
        <p className={styles.apiKeys__loading}>
          <LoaderCircle size={16} className={formStyles.accountSettings__spinner} aria-hidden />
          {t("loading")}
        </p>
      );
    }

    if (keys.length === 0) {
      return (
        <div className={styles.apiKeys__empty}>
          <KeyRound size={22} aria-hidden />
          <strong>{t("empty.title")}</strong>
          <p>{t("empty.text")}</p>
          <Link href="/docs/api/overview" className={styles.apiKeys__docsLink}>
            <BookOpen size={15} aria-hidden />
            {t("docsLink")}
          </Link>
        </div>
      );
    }

    return (
      <>
        <div className={clsx(tableStyles.dataTable__card, styles.apiKeys__table)}>
          <table className={tableStyles.dataTable}>
            <colgroup>
              <col />
              <col className={styles.apiKeys__colPrefix} />
              <col className={styles.apiKeys__colTime} />
              <col className={styles.apiKeys__colTime} />
              <col className={styles.apiKeys__colTime} />
              <col className={styles.apiKeys__colStatus} />
              <col className={styles.apiKeys__colAction} />
            </colgroup>
            <thead>
              <tr>
                <th className={tableStyles.dataTable__start}>{t("columns.name")}</th>
                <th className={tableStyles.dataTable__start}>{t("columns.key")}</th>
                <th>{t("columns.created")}</th>
                <th>{t("columns.lastUsed")}</th>
                <th>{t("columns.expires")}</th>
                <th>{t("columns.status")}</th>
                <th>{t("columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className={tableStyles.dataTable__start}>
                    <span className={styles.apiKeys__name} title={key.name}>
                      {key.name}
                    </span>
                  </td>
                  <td className={tableStyles.dataTable__start}>
                    <code className={styles.apiKeys__prefix}>{`${key.keyPrefix}…`}</code>
                  </td>
                  <td className={tableStyles.dataTable__time}>{formatTime(key.createdAt, "")}</td>
                  <td className={tableStyles.dataTable__time}>
                    {formatTime(key.lastUsedAt, t("neverUsed"))}
                  </td>
                  <td className={tableStyles.dataTable__time}>
                    {formatTime(key.expiresAt, t("neverExpires"))}
                  </td>
                  <td>{renderStatus(key)}</td>
                  <td>{renderRevokeButton(key)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className={styles.apiKeys__cards}>
          {keys.map((key) => (
            <li key={key.id} className={styles.apiKeys__card}>
              <div className={styles.apiKeys__cardHead}>
                <span className={styles.apiKeys__name} title={key.name}>
                  {key.name}
                </span>
                {renderStatus(key)}
              </div>
              <code className={styles.apiKeys__prefix}>{`${key.keyPrefix}…`}</code>
              <dl className={styles.apiKeys__meta}>
                <dt>{t("columns.created")}</dt>
                <dd>{formatTime(key.createdAt, "")}</dd>
                <dt>{t("columns.lastUsed")}</dt>
                <dd>{formatTime(key.lastUsedAt, t("neverUsed"))}</dd>
                <dt>{t("columns.expires")}</dt>
                <dd>{formatTime(key.expiresAt, t("neverExpires"))}</dd>
              </dl>
              {renderRevokeButton(key)}
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <section id="api-keys" className={formStyles.accountSettings__section}>
      <header className={formStyles.accountSettings__sectionHeader}>
        <span className={formStyles.accountSettings__sectionIcon}>
          <KeyRound size={18} />
        </span>
        <h2>{t("title")}</h2>
      </header>

      <div className={clsx(formStyles.accountSettings__sectionBody, styles.apiKeys__body)}>
        <div className={styles.apiKeys__intro}>
          <p>
            {t.rich("intro", {
              docs: (chunks) => (
                <Link href="/docs/api/overview" className={styles.apiKeys__inlineLink}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
          <button
            type="button"
            className={clsx("btn-primary", styles.apiKeys__createButton)}
            onClick={openCreate}
            disabled={!keys || isAtLimit}
          >
            <Plus size={16} aria-hidden />
            {t("create.action")}
          </button>
        </div>

        {isAtLimit ? (
          <p className={formStyles.accountSettings__note}>
            <TriangleAlert size={16} aria-hidden />
            <span>{t("limit", { max: maxActiveKeys })}</span>
          </p>
        ) : null}

        {renderList()}
      </div>

      <Sheet
        open={isCreateOpen}
        onClose={closeCreate}
        title={createdKey ? t("created.title") : t("create.title")}
        isLocked={isCreating || Boolean(createdKey)}
        className={styles.apiKeys__sheet}
        footer={
          createdKey ? (
            <div className={styles.apiKeys__sheetActions}>
              <button type="button" className="btn-primary" onClick={closeCreate}>
                {t("created.done")}
              </button>
            </div>
          ) : (
            <div className={styles.apiKeys__sheetActions}>
              <button
                type="button"
                className="btn-secondary"
                onClick={closeCreate}
                disabled={isCreating}
              >
                {t("create.cancel")}
              </button>
              <button
                type="submit"
                form="api-key-create-form"
                className="btn-primary"
                disabled={isCreating}
              >
                {isCreating ? (
                  <LoaderCircle
                    size={16}
                    className={formStyles.accountSettings__spinner}
                    aria-hidden
                  />
                ) : null}
                {isCreating ? t("create.submitting") : t("create.submit")}
              </button>
            </div>
          )
        }
      >
        {createdKey ? (
          <CreatedKey createdKey={createdKey} />
        ) : (
          <form id="api-key-create-form" className={styles.apiKeys__form} onSubmit={create}>
            <div className={formStyles.accountSettings__field}>
              <label htmlFor="api-key-name">{t("create.name")}</label>
              <input
                id="api-key-name"
                className={clsx(formStyles.accountSettings__input, styles.apiKeys__input)}
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder={t("create.namePlaceholder")}
                maxLength={maxNameLength}
                autoComplete="off"
                required
              />
            </div>

            <fieldset className={styles.apiKeys__expiry}>
              <legend>{t("create.expiry")}</legend>
              <div className={styles.apiKeys__expiryOptions}>
                {expiryOptions.map((option) => (
                  <label
                    key={option}
                    className={clsx(
                      styles.apiKeys__expiryOption,
                      form.expiry === option && styles.apiKeys__expiryOptionActive,
                    )}
                  >
                    <input
                      type="radio"
                      name="api-key-expiry"
                      value={option}
                      checked={form.expiry === option}
                      onChange={() => setForm({ ...form, expiry: option })}
                    />
                    {t(`create.expiryOptions.${option}`)}
                  </label>
                ))}
              </div>
            </fieldset>

            {createError ? (
              <p className={formStyles.accountSettings__message} role="alert">
                {createError}
              </p>
            ) : null}
          </form>
        )}
      </Sheet>

      <ConfirmSheet
        open={Boolean(revokeTarget)}
        title={t("revoke.title")}
        confirmLabel={isRevoking ? t("revoke.submitting") : t("revoke.confirm")}
        cancelLabel={t("revoke.cancel")}
        isLoading={isRevoking}
        isDanger
        onConfirm={() => void revoke()}
        onClose={() => setRevokeTarget(null)}
      >
        <p>{t("revoke.description", { name: revokeTarget?.name ?? "" })}</p>
        {revokeError ? (
          <p className={styles.apiKeys__revokeError} role="alert">
            {revokeError}
          </p>
        ) : null}
      </ConfirmSheet>
    </section>
  );
}

type CreatedKeyProps = {
  createdKey: CreateApiKeyResponse;
};

function CreatedKey(props: CreatedKeyProps) {
  const createdKey = props.createdKey;
  const t = useTranslations("settings.apiKeys.created");
  const [isCopied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  async function copy() {
    try {
      await navigator.clipboard.writeText(createdKey.key);
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError(t("copyFailed"));
    }
  }

  return (
    <div className={styles.apiKeys__created}>
      <div className={styles.apiKeys__warning} role="alert">
        <TriangleAlert size={18} aria-hidden />
        <div>
          <strong>{t("warningTitle")}</strong>
          <p>{t("warningText")}</p>
        </div>
      </div>

      <div className={styles.apiKeys__secretLabel}>{createdKey.name}</div>
      <div className={styles.apiKeys__secret}>
        <code
          className={styles.apiKeys__secretValue}
          onClick={(event) => {
            const selection = window.getSelection();
            selection?.selectAllChildren(event.currentTarget);
          }}
        >
          {createdKey.key}
        </code>
        <button type="button" className="btn-secondary" onClick={() => void copy()}>
          {isCopied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}
          <span aria-live="polite">{isCopied ? t("copied") : t("copy")}</span>
        </button>
      </div>
      {copyError ? (
        <p className={styles.apiKeys__revokeError} role="alert">
          {copyError}
        </p>
      ) : null}

      <p className={styles.apiKeys__usage}>{t("usage")}</p>
      <pre className={styles.apiKeys__usageCode}>
        <code>{`Authorization: Bearer ${createdKey.key}`}</code>
      </pre>

      <Link href="/docs/api/overview" className={styles.apiKeys__docsLink}>
        <BookOpen size={15} aria-hidden />
        {t("docsLink")}
      </Link>
    </div>
  );
}
