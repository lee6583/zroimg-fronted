"use client";

import clsx from "clsx";
import { useState } from "react";
import { Send } from "lucide-react";
import { galleryApi } from "@/api/generation/gallery";
import type { GalleryStatus } from "@/types/gallery";
import { getErrorMessage } from "@/utils/error";
import { galleryStatusLabels } from "@/utils/gallery";
import styles from "./publish-button.module.css";

type PublishGalleryButtonProps = {
  generatedImageId: string;
  initialStatus: GalleryStatus | null;
  initialReason: string | null;
  hideStatus?: boolean;
  onChange?: (status: GalleryStatus) => void;
};

function getStatusTitle(status: GalleryStatus | null, reason: string | null) {
  if (status === "rejected") {
    return `未通过：${reason || "未填写原因"}`;
  }

  if (status === "removed") {
    return `已下架：${reason || "未填写原因"}。如有疑问请通过意见反馈联系我们`;
  }

  return undefined;
}

export function PublishGalleryButton(props: PublishGalleryButtonProps) {
  const generatedImageId = props.generatedImageId;
  const initialStatus = props.initialStatus;
  const initialReason = props.initialReason;
  const hideStatus = props.hideStatus ?? false;
  const onChange = props.onChange;

  const [status, setStatus] = useState(initialStatus);
  const [reason, setReason] = useState(initialReason);
  const [isLoading, setLoading] = useState(false);
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
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  async function withdraw() {
    if (status === "approved" && !window.confirm("取消公开后需重新提交审核，确定吗？")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await galleryApi.withdrawImage(generatedImageId);
      applyStatus("withdrawn", null);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const isIdle = status === null || status === "withdrawn";
  let visibleStatus: GalleryStatus | null = null;
  if (!isIdle && !hideStatus) {
    visibleStatus = status;
  }
  const canWithdraw = status === "pending" || status === "approved";
  const title = getStatusTitle(status, reason);
  let withdrawLabel = "撤回";
  if (status === "approved") {
    withdrawLabel = "取消公开";
  }

  return (
    <div className={styles.publishButton}>
      {isIdle ? (
        <button
          type="button"
          onClick={submit}
          disabled={isLoading}
          className={styles.publishButton__action}
        >
          <Send size={12} />
          {isLoading ? "提交中" : "投稿到画廊"}
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
          {galleryStatusLabels[visibleStatus]}
        </span>
      ) : null}

      {canWithdraw ? (
        <button
          type="button"
          onClick={withdraw}
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
          重新提交
        </button>
      ) : null}

      {message ? (
        <span className={styles.publishButton__message} title={message}>
          {message}
        </span>
      ) : null}
    </div>
  );
}
