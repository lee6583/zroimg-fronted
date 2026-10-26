"use client";

import clsx from "clsx";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { adminUsersApi } from "@/api/admin/users";
import type { AdminUserDetail } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import styles from "./user-generation-limits.module.css";

type UserGenerationLimitsProps = {
  user: AdminUserDetail;
};

type LimitField = "image" | "video";

type LimitRow = {
  field: LimitField;
  label: string;
  max: number;
  value: number | null;
  effective: number;
};

function readInput(value: number | null) {
  if (value === null) return "";
  return String(value);
}

function readValue(input: string) {
  const text = input.trim();
  if (!text) return null;
  return Number(text);
}

export function UserGenerationLimits(props: UserGenerationLimitsProps) {
  const router = useRouter();

  const [user, setUser] = useState(props.user);
  const [isEditing, setEditing] = useState(false);
  const [form, setForm] = useState({ image: "", video: "" });
  const [message, setMessage] = useState("");
  const [isError, setError] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const rows: LimitRow[] = [
    {
      field: "image",
      label: "图片任务",
      max: 50,
      value: user.maxActiveImageTasks,
      effective: user.effectiveMaxActiveImageTasks,
    },
    {
      field: "video",
      label: "视频任务",
      max: 20,
      value: user.maxActiveVideoTasks,
      effective: user.effectiveMaxActiveVideoTasks,
    },
  ];

  function openEditor() {
    setForm({
      image: readInput(user.maxActiveImageTasks),
      video: readInput(user.maxActiveVideoTasks),
    });
    setMessage("");
    setError(false);
    setEditing(true);
  }

  function updateField(field: LimitField, value: string) {
    setForm((currentForm) => {
      return {
        ...currentForm,
        [field]: value,
      };
    });
  }

  async function saveLimits(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const nextUser = await adminUsersApi.updateGenerationLimits(user.id, {
        maxActiveImageTasks: readValue(form.image),
        maxActiveVideoTasks: readValue(form.video),
      });
      setUser(nextUser);
      setEditing(false);
      setError(false);
      setMessage("已保存");
      router.refresh();
    } catch (error) {
      setError(true);
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.limits} aria-labelledby="generation-limits-title">
      <header className={styles.limits__header}>
        <h2 id="generation-limits-title">生成并发</h2>
        {isEditing ? null : (
          <button
            type="button"
            className={styles.limits__editButton}
            aria-label="编辑生成并发"
            title="编辑生成并发"
            onClick={openEditor}
          >
            <Pencil size={14} />
          </button>
        )}
      </header>

      {isEditing ? (
        <form className={styles.limits__form} onSubmit={saveLimits}>
          {rows.map((row) => (
            <label key={row.field} className={styles.limits__field}>
              <span>{row.label}</span>
              <input
                className="field"
                type="number"
                inputMode="numeric"
                min={1}
                max={row.max}
                step={1}
                placeholder="使用默认"
                value={form[row.field]}
                onChange={(event) => updateField(row.field, event.target.value)}
              />
              <span className={styles.limits__hint}>1 - {row.max}，留空使用默认</span>
            </label>
          ))}
          <div className={styles.limits__actions}>
            <button
              type="button"
              className="btn-secondary"
              disabled={isSaving}
              onClick={() => setEditing(false)}
            >
              取消
            </button>
            <button className="btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? "保存中" : "保存"}
            </button>
          </div>
        </form>
      ) : (
        <dl className={styles.limits__list}>
          {rows.map((row) => (
            <div key={row.field} className={styles.limits__row}>
              <dt>{row.label}</dt>
              <dd>
                <strong>{row.effective} 个</strong>
                <span
                  className={clsx(
                    styles.limits__source,
                    row.value !== null && styles.limits__sourceCustom,
                  )}
                >
                  {row.value === null ? "默认" : "单独设置"}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {message ? (
        <p
          className={clsx(styles.limits__message, isError && styles.limits__messageError)}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}
