"use client";

import clsx from "clsx";
import { Check, Copy, Expand, Sparkles } from "lucide-react";
import { useState, type CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ImageViewer } from "@/components/ui/image-lightbox";
import { Sheet } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Link } from "@/i18n/navigation";
import type { GalleryImage } from "@/types/gallery";
import { parseJavaDateTime } from "@/utils/java-time";
import { LikeButton } from "./like-button";
import styles from "./gallery-detail.module.css";

type GalleryDetailProps = {
  item: GalleryImage | null;
  isOpen: boolean;
  isLoading: boolean;
  hasError: boolean;
  isLikeDisabled: boolean;
  likeDisabledReason?: string;
  onClose: () => void;
  onToggleLike: (item: GalleryImage) => void;
  onOpenCreator: (item: GalleryImage, anchor: HTMLElement) => void;
};

// 「用这个提示词创作」带到生成页的提示词上限，与生成页截断长度一致
const maxPromptParam = 4000;

/** 作品详情：桌面居中大对话框，手机底部全高面板；地址带 ?image=<id>，返回键关闭。 */
export function GalleryDetail(props: GalleryDetailProps) {
  const item = props.item;
  const t = useTranslations("gallery.detail");
  const tCard = useTranslations("gallery.card");
  const format = useFormatter();
  const [isViewerOpen, setViewerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState("");

  async function copyPrompt(value: GalleryImage) {
    try {
      await navigator.clipboard.writeText(value.prompt);
      setCopiedId(value.id);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      // 剪贴板不可用（非安全上下文等）时不提示，用户仍可手动选择文本
    }
  }

  let content = <p className={styles.detail__state}>{t("loading")}</p>;
  if (!item && props.hasError) {
    content = <p className={styles.detail__state}>{t("notFound")}</p>;
  }

  if (item) {
    const image = item.generatedImage;
    const author = item.userProfile.username || item.userProfile.user?.name || tCard("anonymous");
    const ratio = (image.width || 1) / (image.height || 1);
    // --ar 供 CSS 计算「不超过可视高度」的宽度，保证图片框始终保持原图比例
    const frameStyle = { "--ar": ratio } as CSSProperties;
    if (image.lqip) {
      frameStyle.backgroundImage = `url("${image.lqip}")`;
    }
    const isCopied = copiedId === item.id;
    const promptParam = item.prompt.slice(0, maxPromptParam);

    content = (
      <div className={styles.detail}>
        <div className={styles.detail__stage}>
          <button
            type="button"
            className={styles.detail__frame}
            style={frameStyle}
            onClick={() => setViewerOpen(true)}
            aria-label={t("viewOriginal")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- 详情用 1600 预览图，原图在全屏查看时才加载 */}
            <img
              key={item.id}
              className={styles.detail__image}
              src={image.previewUrl}
              alt={item.title || item.prompt.slice(0, 120)}
              width={image.width || undefined}
              height={image.height || undefined}
              decoding="async"
            />
          </button>
        </div>

        <div className={styles.detail__info}>
          <h2 className={styles.detail__title}>{item.title || tCard("untitled")}</h2>

          <div className={styles.detail__row}>
            <button
              type="button"
              className={styles.detail__creator}
              aria-label={t("openCreator", { name: author })}
              onClick={(event) => props.onOpenCreator(item, event.currentTarget)}
            >
              <UserAvatar name={author} src={item.userProfile.avatarUrl} size={28} decorative />
              <span className={styles.detail__creatorName}>{author}</span>
            </button>
            <LikeButton
              variant="detail"
              liked={item.liked}
              count={item.likeCount}
              isDisabled={props.isLikeDisabled}
              disabledReason={props.likeDisabledReason}
              onToggle={() => props.onToggleLike(item)}
            />
          </div>

          <dl className={styles.detail__facts}>
            <div>
              <dt>{t("category")}</dt>
              <dd>
                <span className={styles.detail__chip}>{item.categoryName}</span>
              </dd>
            </div>
            {item.modelName ? (
              <div>
                <dt>{t("model")}</dt>
                <dd>{item.modelName}</dd>
              </div>
            ) : null}
            <div>
              <dt>{t("published")}</dt>
              <dd>
                {format.dateTime(parseJavaDateTime(item.reviewTime || item.createdAt), "short")}
              </dd>
            </div>
          </dl>

          <section className={styles.detail__prompt}>
            <div className={styles.detail__promptHeader}>
              <h3>{t("prompt")}</h3>
              <button
                type="button"
                className={styles.detail__copy}
                onClick={() => copyPrompt(item)}
                aria-live="polite"
              >
                {isCopied ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
                {isCopied ? t("copied") : t("copy")}
              </button>
            </div>
            <p
              className={clsx(
                styles.detail__promptText,
                props.isLoading && styles.detail__promptLoading,
              )}
            >
              {item.prompt}
            </p>
          </section>

          <div className={styles.detail__actions}>
            <Link
              href={{ pathname: "/generate", query: { prompt: promptParam } }}
              className={clsx("btn-primary", styles.detail__action)}
            >
              <Sparkles size={15} aria-hidden="true" />
              {t("usePrompt")}
            </Link>
            <button
              type="button"
              className={clsx("btn-secondary", styles.detail__action)}
              onClick={() => setViewerOpen(true)}
            >
              <Expand size={15} aria-hidden="true" />
              {t("viewOriginal")}
            </button>
          </div>
        </div>

        <ImageViewer
          open={isViewerOpen}
          src={image.imageUrl}
          alt={item.title || item.prompt.slice(0, 120)}
          onClose={() => setViewerOpen(false)}
        />
      </div>
    );
  }

  return (
    <Sheet
      open={props.isOpen}
      onClose={props.onClose}
      title={t("label")}
      isLocked={isViewerOpen}
      className={styles.detailSheet}
    >
      {content}
    </Sheet>
  );
}
