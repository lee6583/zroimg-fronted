"use client";

import clsx from "clsx";
import { useState } from "react";
import { Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { galleryApi } from "@/api/generation/gallery";
import { ConfirmSheet } from "@/features/history/confirm-sheet";
import { translateApiError } from "@/i18n/api-error";
import type { GalleryStatus } from "@/types/gallery";
import styles from "./publish-button.module.css";

type PublishGalleryButtonProps = {
  generatedImageId: string;
  initialStatus: GalleryStatus | null;
  initialReason: string | null;
  hideStatus?: boolean;
  // touch：手机端放大点击区域（≥ 44px），用于列表卡片
  size?: "compact" | "touch";
  onChange?: (status: GalleryStatus) => void;
};

export function PublishGalleryButton(props: PublishGalleryButtonProps) {
  const generatedImageId = props.generatedImageId;
  const initialStatus = props.initialStatus;
  const initialReason = props.initialReason;
  const hideStatus = props.hideStatus ?? false;
  const isTouch = props.size === "touch";
  const onChange = props.onChange;

  const t = useTranslations("gallery");
  const tError = useTranslations("errors.api");
  const [status, setStatus] = useState(initialStatus);
  const [reason, setReason] = useState(initialReason);
  const [isLoading, setLoading] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState("");

  function applyStatus(nextStatus: GalleryStatus, nextReason: string | null) {
    setStatus(nextStatus);
    setReason(nextReason);
    onChange?.(nextStatus);
  }

  async function submit() {
    setLoading(true);
    setMessage("");

    try {
      const image = await galleryApi.publishImage({ generatedImageId });
      applyStatus(image.status, image.rejectReason);
    } catch (error) {
      setMessage(translateApiError(error, tError));
    } finally {
      setLoading(false);
    }
  }

  async function withdraw() {
    setLoading(true);
    setMessage("");

    try {
      await galleryApi.withdrawImage(generatedImageId);
      applyStatus("withdrawn", null);
      setConfirmOpen(false);
    } catch (error) {
      setMessage(translateApiError(error, tError));
      setConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function requestWithdraw() {
    // 已公开的作品取消后需要重新审核，先确认；审核中的直接撤回
    if (status === "approved") {
      setConfirmOpen(true);
      return;
    }

    void withdraw();
  }

  function getStatusTitle() {
    const visibleReason = reason || t("publish.noReason");
    if (status === "rejected") {
      return t("publish.rejectedTitle", { reason: visibleReason });
    }

    if (status === "removed") {
      return t("publish.removedTitle", { reason: visibleReason });
    }

    return undefined;
  }

  const isIdle = status === null || status === "withdrawn";
  let visibleStatus: GalleryStatus | null = null;
  if (!isIdle && !hideStatus) {
    visibleStatus = status;
  }
  const canWithdraw = status === "pending" || status === "approved";
  const title = getStatusTitle();
  let withdrawLabel = t("publish.withdraw");
  if (status === "approved") {
    withdrawLabel = t("publish.unpublish");
  }

  return (
    <div className={clsx(styles.publishButton, isTouch && styles.publishButtonTouch)}>
      {isIdle ? (
        <button
          type="button"
          onClick={submit}
          disabled={isLoading}
          className={styles.publishButton__action}
        >
          <Send size={12} />
          {isLoading ? t("publish.submitting") : t("publish.submit")}
        </button>
      ) : null}

      {visibleStatus ? (
        <span
          title={title}
          className={clsx(
            styles.publishButton__status,
            status === "pending" && styles.publishButton__statusPending,
            status === "approved" && styles.publishButton__statusApproved,
            status === "rejected" && styles.publishButton__statusDanger,
            status === "removed" && styles.publishButton__statusMuted,
          )}
        >
          {t(`status.${visibleStatus}`)}
        </span>
      ) : null}

      {canWithdraw ? (
        <button
          type="button"
          onClick={requestWithdraw}
          disabled={isLoading}
          className={styles.publishButton__link}
        >
          {withdrawLabel}
        </button>
      ) : null}

      {status === "rejected" ? (
        <button
          type="button"
          onClick={submit}
          disabled={isLoading}
          className={styles.publishButton__link}
        >
          {t("publish.resubmit")}
        </button>
      ) : null}

      {message ? (
        <span className={styles.publishButton__message} title={message}>
          {message}
        </span>
      ) : null}

      <ConfirmSheet
        open={isConfirmOpen}
        title={t("publish.unpublishTitle")}
        confirmLabel={t("publish.unpublish")}
        cancelLabel={t("publish.cancel")}
        isLoading={isLoading}
        onConfirm={withdraw}
        onClose={() => setConfirmOpen(false)}
      >
        {t("publish.unpublishConfirm")}
      </ConfirmSheet>
    </div>
  );
}
