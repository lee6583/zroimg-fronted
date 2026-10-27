"use client";

import { useEffect, useEffectEvent, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useFormatter, useTranslations } from "next-intl";
import { galleryApi } from "@/api/generation/gallery";
import { Sheet, useIsMobile } from "@/components/ui/sheet";
import { UserAvatar } from "@/components/ui/user-avatar";
import type { GalleryCreator } from "@/types/gallery";
import { parseJavaDateTime } from "@/utils/java-time";
import styles from "./creator-card.module.css";

type CreatorCardProps = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  anchor: DOMRect | null;
  onClose: () => void;
};

type CreatorState = {
  userId: string;
  creator: GalleryCreator | null;
  hasError: boolean;
};

const popoverWidth = 288;
const margin = 12;

// 同一页面里同一创作者只请求一次（接口另有 60 秒缓存）
const creatorCache = new Map<string, Promise<GalleryCreator>>();

function loadCreator(userId: string) {
  let promise = creatorCache.get(userId);
  if (!promise) {
    promise = galleryApi.getCreator(userId).catch((error: unknown) => {
      creatorCache.delete(userId);
      throw error;
    });
    creatorCache.set(userId, promise);
  }

  return promise;
}

function popoverStyle(anchor: DOMRect): CSSProperties {
  // 优先与作者名左对齐，放不下时向左移
  const left = Math.max(margin, Math.min(anchor.left, window.innerWidth - popoverWidth - margin));
  const spaceBelow = window.innerHeight - anchor.bottom;
  if (spaceBelow < 260 && anchor.top > spaceBelow) {
    return { left, bottom: window.innerHeight - anchor.top + 8, width: popoverWidth };
  }

  return { left, top: anchor.bottom + 8, width: popoverWidth };
}

/** 创作者卡片：桌面为锚定在作者名旁的浮层，手机为底部面板。只展示公开信息。 */
export function CreatorCard(props: CreatorCardProps) {
  const userId = props.userId;
  const anchor = props.anchor;
  const t = useTranslations("gallery.creator");
  const format = useFormatter();
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CreatorState>({ userId: "", creator: null, hasError: false });
  const onClose = useEffectEvent(() => props.onClose());

  useEffect(() => {
    let isActive = true;
    loadCreator(userId)
      .then((creator) => {
        if (isActive) setState({ userId, creator, hasError: false });
      })
      .catch(() => {
        if (isActive) setState({ userId, creator: null, hasError: true });
      });

    return () => {
      isActive = false;
    };
  }, [userId]);

  // 桌面浮层：点外面、Esc、滚动页面都关闭
  useEffect(() => {
    if (isMobile) return;

    function closeOnOutside(event: PointerEvent) {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    }

    function closeOnKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    function closeOnScroll() {
      onClose();
    }

    document.addEventListener("pointerdown", closeOnOutside, true);
    document.addEventListener("keydown", closeOnKey);
    window.addEventListener("scroll", closeOnScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside, true);
      document.removeEventListener("keydown", closeOnKey);
      window.removeEventListener("scroll", closeOnScroll);
    };
  }, [isMobile]);

  const isCurrent = state.userId === userId;
  const creator = isCurrent ? state.creator : null;
  const name = creator?.username || props.name;
  const avatarUrl = creator?.avatarUrl ?? props.avatarUrl;

  let body = <p className={styles.creator__muted}>{t("loading")}</p>;
  if (isCurrent && state.hasError) {
    body = <p className={styles.creator__muted}>{t("error")}</p>;
  }
  if (creator) {
    const joined = format.dateTime(parseJavaDateTime(creator.joinedAt), {
      year: "numeric",
      month: "long",
    });
    body = (
      <>
        <p className={creator.bio ? styles.creator__bio : styles.creator__muted}>
          {creator.bio || t("noBio")}
        </p>
        <dl className={styles.creator__stats}>
          <div>
            <dd>{format.number(creator.publishedCount)}</dd>
            <dt>{t("published")}</dt>
          </div>
          <div>
            <dd>{format.number(creator.imageCount)}</dd>
            <dt>{t("images")}</dt>
          </div>
          <div>
            <dd>{format.number(creator.videoCount)}</dd>
            <dt>{t("videos")}</dt>
          </div>
        </dl>
        <p className={styles.creator__joined}>{t("joined", { date: joined })}</p>
      </>
    );
  }

  const content = (
    <div className={styles.creator}>
      <div className={styles.creator__head}>
        <UserAvatar name={name} src={avatarUrl} size={44} />
        <strong className={styles.creator__name} title={name}>
          {name}
        </strong>
      </div>
      {body}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open onClose={props.onClose} title={t("label")}>
        {content}
      </Sheet>
    );
  }

  if (!anchor) {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={t("label")}
      className={styles.creator__popover}
      style={popoverStyle(anchor)}
    >
      {content}
    </div>,
    document.body,
  );
}
