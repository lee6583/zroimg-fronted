"use client";

import clsx from "clsx";
import { HoverText } from "@/components/ui/hover-text";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGalleryApi } from "@/api/admin/gallery";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { AdminGallerySubmission } from "@/types/admin";
import type { GalleryCategory, GalleryStatus } from "@/types/gallery";
import { getErrorMessage } from "@/utils/error";
import { formatGalleryTime, galleryCategoryLabels, galleryStatusLabels } from "@/utils/gallery";
import workspace from "./admin-workspace.module.css";
import styles from "./gallery-review.module.css";

type GalleryReviewProps = {
  status: GalleryStatus;
  submissions: AdminGallerySubmission[];
};

type ReasonMode = "reject" | "remove";

type ReasonDialog = {
  mode: ReasonMode;
  submission: AdminGallerySubmission;
};

const presetReasons = ["违规内容", "画质较差", "疑似侵权", "与分类不符"];
const categories = Object.keys(galleryCategoryLabels) as GalleryCategory[];
const maxBatch = 50;
const maxReason = 200;

function statusClass(status: GalleryStatus) {
  if (status === "approved") return workspace.statusSuccess;
  if (status === "pending") return workspace.statusWarning;
  if (status === "rejected" || status === "removed") return workspace.statusDanger;
  return undefined;
}

export function GalleryReview(props: GalleryReviewProps) {
  const status = props.status;
  const submissions = props.submissions;
  const router = useRouter();

  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryById, setCategoryById] = useState<Record<string, GalleryCategory>>({});
  const [busyId, setBusyId] = useState("");
  const [dialog, setDialog] = useState<ReasonDialog | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setError] = useState(false);

  const visible = submissions.filter((item) => !hiddenIds.includes(item.id));
  const isPendingTab = status === "pending";
  const isAllSelected = visible.length > 0 && selectedIds.length === visible.length;
  const trimmedReason = reason.trim();

  useEffect(() => {
    if (!dialog) return;

    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setDialog(null);
    }

    document.addEventListener("keydown", closeByEscape);
    return () => document.removeEventListener("keydown", closeByEscape);
  }, [dialog]);

  function showMessage(text: string, hasError: boolean) {
    setMessage(text);
    setError(hasError);
  }

  function hide(ids: string[]) {
    setHiddenIds((current) => [...current, ...ids]);
    setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
    router.refresh();
  }

  function toggle(id: string) {
    setSelectedIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  }

  function toggleAll() {
    if (isAllSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(visible.map((item) => item.id));
  }

  async function approve(submission: AdminGallerySubmission) {
    const category = categoryById[submission.id];
    setBusyId(submission.id);
    setMessage("");

    try {
      await adminGalleryApi.approve(submission.id, { category });
      showMessage("已通过", false);
      hide([submission.id]);
    } catch (error) {
      showMessage(getErrorMessage(error), true);
    } finally {
      setBusyId("");
    }
  }

  async function approveBatch() {
    const ids = selectedIds.slice(0, maxBatch);
    setBusyId("batch");
    setMessage("");

    try {
      const result = await adminGalleryApi.batchApprove({ ids });
      showMessage(`已通过 ${result.approved} 张，跳过 ${result.skipped} 张`, false);
      hide(ids);
    } catch (error) {
      showMessage(getErrorMessage(error), true);
    } finally {
      setBusyId("");
    }
  }

  function openDialog(mode: ReasonMode, submission: AdminGallerySubmission) {
    setReason("");
    setDialog({ mode, submission });
  }

  async function submitReason() {
    if (!dialog || !trimmedReason) return;

    const submission = dialog.submission;
    const data = { reason: trimmedReason };
    setBusyId(submission.id);
    setMessage("");

    try {
      if (dialog.mode === "reject") {
        await adminGalleryApi.reject(submission.id, data);
        showMessage("已拒绝", false);
      } else {
        await adminGalleryApi.remove(submission.id, data);
        showMessage("已下架", false);
      }
      setDialog(null);
      hide([submission.id]);
    } catch (error) {
      showMessage(getErrorMessage(error), true);
    } finally {
      setBusyId("");
    }
  }

  let dialogTitle = "拒绝投稿";
  let confirmLabel = "确认拒绝";
  if (dialog?.mode === "remove") {
    dialogTitle = "下架作品";
    confirmLabel = "确认下架";
  }

  return (
    <>
      {message ? (
        <p className={clsx(isError ? workspace.inlineAlert : workspace.inlineMessage)}>{message}</p>
      ) : null}

      {isPendingTab && visible.length > 0 ? (
        <div className={styles.review__batch}>
          <label className={styles.review__check}>
            <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
            全选
          </label>
          <button
            type="button"
            className={workspace.primaryAction}
            disabled={selectedIds.length === 0 || busyId !== ""}
            onClick={approveBatch}
          >
            <Check size={14} aria-hidden="true" />
            批量通过 {selectedIds.length > 0 ? selectedIds.length : ""}
          </button>
        </div>
      ) : null}

      {visible.length > 0 ? (
        <div className={styles.review__grid}>
          {visible.map((item) => {
            const isBusy = busyId === item.id || busyId === "batch";
            const isSelected = selectedIds.includes(item.id);
            const hasReason = item.status === "rejected" || item.status === "removed";
            const canReapprove = item.status === "rejected" || item.status === "removed";
            const category = categoryById[item.id] ?? item.category;
            const uploader = item.username || item.email || item.userId;
            const title = item.title?.trim() ?? "";
            const hasTitle = title !== "" && !item.prompt.startsWith(title);
            let size = "-";
            if (item.width && item.height) {
              size = `${item.width} × ${item.height}`;
            }

            return (
              <article
                key={item.id}
                className={clsx(styles.review__card, isSelected && styles.review__cardSelected)}
              >
                <div className={styles.review__media}>
                  <ImageLightbox
                    src={item.imageUrl}
                    alt={item.title || item.prompt}
                    width={item.width || 1024}
                    height={item.height || 1024}
                    imageClassName={styles.review__image}
                  />
                  {isPendingTab ? (
                    <label className={styles.review__select} aria-label="选择投稿">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(item.id)}
                      />
                    </label>
                  ) : null}
                </div>

                <div className={styles.review__body}>
                  <div className={styles.review__meta}>
                    <span className={clsx(workspace.status, statusClass(item.status))}>
                      {galleryStatusLabels[item.status]}
                    </span>
                    <span className={workspace.badge}>{galleryCategoryLabels[item.category]}</span>
                  </div>

                  {hasTitle ? <p className={styles.review__title}>{title}</p> : null}
                  <HoverText as="p" className={styles.review__prompt} text={item.prompt} />

                  {hasReason && item.rejectReason ? (
                    <p className={styles.review__reason}>原因：{item.rejectReason}</p>
                  ) : null}

                  <dl className={styles.review__facts}>
                    <div>
                      <dt>用户</dt>
                      <dd>
                        <Link href={`/admin/users/${item.userId}`} className={styles.review__link}>
                          {uploader}
                        </Link>
                      </dd>
                    </div>
                    <div>
                      <dt>模型</dt>
                      <dd>{item.modelName || item.modelCode || "-"}</dd>
                    </div>
                    <div>
                      <dt>尺寸</dt>
                      <dd>{size}</dd>
                    </div>
                    <div>
                      <dt>投稿</dt>
                      <dd>{formatGalleryTime(item.submitTime)}</dd>
                    </div>
                    <div>
                      <dt>审核</dt>
                      <dd>{formatGalleryTime(item.reviewTime)}</dd>
                    </div>
                  </dl>

                  {item.status === "pending" ? (
                    <div className={styles.review__actions}>
                      <select
                        aria-label="通过时的分类"
                        className={styles.review__category}
                        value={category}
                        disabled={isBusy}
                        onChange={(event) => {
                          const value = event.target.value as GalleryCategory;
                          setCategoryById((current) => ({ ...current, [item.id]: value }));
                        }}
                      >
                        {categories.map((option) => (
                          <option key={option} value={option}>
                            {galleryCategoryLabels[option]}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className={workspace.primaryAction}
                        disabled={isBusy}
                        onClick={() => approve(item)}
                      >
                        通过
                      </button>
                      <button
                        type="button"
                        className={workspace.dangerAction}
                        disabled={isBusy}
                        onClick={() => openDialog("reject", item)}
                      >
                        拒绝
                      </button>
                    </div>
                  ) : null}

                  {item.status === "approved" ? (
                    <div className={styles.review__actions}>
                      <button
                        type="button"
                        className={workspace.dangerAction}
                        disabled={isBusy}
                        onClick={() => openDialog("remove", item)}
                      >
                        下架
                      </button>
                    </div>
                  ) : null}

                  {canReapprove ? (
                    <div className={styles.review__actions}>
                      <button
                        type="button"
                        className={workspace.secondaryAction}
                        disabled={isBusy}
                        onClick={() => approve(item)}
                      >
                        重新通过
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={workspace.empty}>没有匹配的投稿</div>
      )}

      {dialog ? (
        <>
          <button
            type="button"
            className={workspace.drawerBackdrop}
            aria-label="关闭"
            onClick={() => setDialog(null)}
          />
          <aside
            className={workspace.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-reason-title"
          >
            <header className={workspace.drawerHeader}>
              <h2 id="gallery-reason-title" className={workspace.drawerTitle}>
                {dialogTitle}
              </h2>
              <button
                className={workspace.iconAction}
                type="button"
                aria-label="关闭"
                title="关闭"
                onClick={() => setDialog(null)}
              >
                <X size={16} />
              </button>
            </header>

            <div className={workspace.drawerBody}>
              <div className={workspace.formSection}>
                <div className={styles.review__presets}>
                  {presetReasons.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={clsx(
                        styles.review__preset,
                        reason === preset && styles.review__presetActive,
                      )}
                      onClick={() => setReason(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <label className={workspace.fieldGroup}>
                  <span className={workspace.fieldLabel}>原因</span>
                  <textarea
                    className={workspace.formTextarea}
                    value={reason}
                    maxLength={maxReason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <span className={workspace.fieldHint}>
                    用户可见，{reason.length}/{maxReason}
                  </span>
                </label>
              </div>
            </div>

            <footer className={workspace.drawerFooter}>
              <button
                className={workspace.secondaryAction}
                type="button"
                onClick={() => setDialog(null)}
              >
                取消
              </button>
              <button
                className={workspace.dangerAction}
                type="button"
                disabled={!trimmedReason || busyId !== ""}
                onClick={submitReason}
              >
                {confirmLabel}
              </button>
            </footer>
          </aside>
        </>
      ) : null}
    </>
  );
}
