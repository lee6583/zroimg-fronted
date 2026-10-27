"use client";

import clsx from "clsx";
import { useState, type CSSProperties, type MouseEvent } from "react";
import { useTranslations } from "next-intl";
import { HoverText } from "@/components/ui/hover-text";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { GalleryImage } from "@/types/gallery";
import { LikeButton } from "./like-button";
import styles from "./gallery-feed.module.css";

type GalleryCardProps = {
  item: GalleryImage;
  href: string;
  style: CSSProperties;
  isEager: boolean;
  isLikeDisabled: boolean;
  likeDisabledReason?: string;
  onOpen: (item: GalleryImage) => void;
  onOpenCreator: (item: GalleryImage, anchor: HTMLElement) => void;
  onToggleLike: (item: GalleryImage) => void;
};

// 列宽约 180–330px：普通屏用 768 缩略图，2x/3x 屏或宽列时浏览器自动选 1600 预览图
const imageSizes =
  "(min-width: 1440px) 270px, (min-width: 1200px) 25vw, (min-width: 900px) 33vw, (min-width: 360px) 50vw, 100vw";

export function GalleryCard(props: GalleryCardProps) {
  const item = props.item;
  const t = useTranslations("gallery.card");
  const [isLoaded, setLoaded] = useState(false);
  const image = item.generatedImage;
  const title = item.title || t("untitled");
  const author = item.userProfile.username || item.userProfile.user?.name || t("anonymous");

  function open(event: MouseEvent<HTMLAnchorElement>) {
    // 保留新标签页打开（Ctrl/⌘/中键）的默认行为
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    props.onOpen(item);
  }

  let mediaStyle: CSSProperties | undefined;
  if (image.lqip) {
    mediaStyle = { backgroundImage: `url("${image.lqip}")` };
  }

  return (
    <article className={styles.card} style={props.style}>
      <a
        href={props.href}
        className={styles.card__media}
        style={mediaStyle}
        aria-label={t("open", { title })}
        onClick={open}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 公开媒体走 Java 接口，按缩略图/预览图两档 srcset 自行选择 */}
        <img
          ref={(element) => {
            // SSR 的图片可能在水合前就已加载完成，onLoad 不会再触发
            if (element?.complete && element.naturalWidth > 0) {
              setLoaded(true);
            }
          }}
          className={clsx(styles.card__image, isLoaded && styles.card__imageLoaded)}
          src={image.thumbnailUrl}
          srcSet={`${image.thumbnailUrl} 768w, ${image.previewUrl} 1600w`}
          sizes={imageSizes}
          alt={item.title || item.prompt}
          width={image.width || undefined}
          height={image.height || undefined}
          loading={props.isEager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
        />
      </a>
      <div className={styles.card__footer}>
        <HoverText as="h2" className={styles.card__title} text={title} />
        <div className={styles.card__meta}>
          <LikeButton
            liked={item.liked}
            count={item.likeCount}
            isDisabled={props.isLikeDisabled}
            disabledReason={props.likeDisabledReason}
            onToggle={() => props.onToggleLike(item)}
          />
          <button
            type="button"
            className={styles.card__creator}
            title={author}
            onClick={(event) => props.onOpenCreator(item, event.currentTarget)}
          >
            <UserAvatar name={author} src={item.userProfile.avatarUrl} size={18} decorative />
            <span className={styles.card__creatorName}>{author}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
