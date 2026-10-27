"use client";

import clsx from "clsx";
import { Heart } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import styles from "./like-button.module.css";

type LikeButtonProps = {
  liked: boolean;
  count: number;
  isDisabled?: boolean;
  disabledReason?: string;
  // card：卡片底栏的小号；detail：详情里的按钮样式
  variant?: "card" | "detail";
  onToggle: () => void;
};

export function LikeButton(props: LikeButtonProps) {
  const liked = props.liked;
  const count = props.count;
  const variant = props.variant ?? "card";
  const t = useTranslations("gallery.like");
  const format = useFormatter();

  let label = t("like");
  if (liked) {
    label = t("unlike");
  }
  const title = props.disabledReason ?? `${label} · ${t("count", { count })}`;

  return (
    <button
      type="button"
      className={clsx(
        styles.likeButton,
        variant === "detail" && styles.likeButtonDetail,
        liked && styles.likeButtonActive,
      )}
      aria-pressed={liked}
      aria-label={`${label} · ${t("count", { count })}`}
      title={title}
      disabled={props.isDisabled}
      onClick={(event) => {
        event.stopPropagation();
        props.onToggle();
      }}
    >
      <Heart size={variant === "detail" ? 16 : 14} aria-hidden="true" />
      <span className={styles.likeButton__count}>
        {format.number(count, { notation: "compact", maximumFractionDigits: 1 })}
      </span>
    </button>
  );
}
