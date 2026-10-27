"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useSwipeDismiss } from "./use-swipe-dismiss";
import styles from "./image-lightbox.module.css";

type ImageLightboxProps = {
  src: string;
  previewSrc?: string;
  alt: string;
  width: number;
  height: number;
  fit?: "container" | "intrinsic";
  triggerClassName?: string;
  imageClassName?: string;
};

type ImageViewerProps = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

/** 受控的全屏看图层：点遮罩空白处、右上角关闭按钮、Esc 或手机下滑都能关闭。 */
export function ImageViewer(props: ImageViewerProps) {
  const t = useTranslations("ui.lightbox");
  const isOpen = props.open;
  const onClose = props.onClose;
  const swipe = useSwipeDismiss(onClose);

  useEffect(() => {
    if (!isOpen) return;

    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeByEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeByEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      className={styles.imageLightbox__overlay}
      role="presentation"
      {...swipe.handlers}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={styles.imageLightbox__viewer}
        role="dialog"
        aria-modal="true"
        style={swipe.style}
        aria-label={t("dialog")}
        onMouseDown={(event) => {
          // 点在图片外的空白区域（viewer 容器本身）也算“旁边”，关闭
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 画布里的用户私有媒体走 Java 接口 */}
        <img
          className={styles.imageLightbox__image}
          src={props.src}
          alt={props.alt}
          draggable={false}
        />
      </div>
      <button
        type="button"
        aria-label={t("close")}
        title={t("closeTitle")}
        className={styles.imageLightbox__close}
        onClick={onClose}
      >
        <X size={22} />
      </button>
    </div>,
    document.body,
  );
}

export function ImageLightbox(props: ImageLightboxProps) {
  const src = props.src;
  const previewSrc = props.previewSrc ?? src;
  const alt = props.alt;
  const width = props.width;
  const height = props.height;
  const fit = props.fit ?? "container";
  const triggerClassName = props.triggerClassName;
  const imageClassName = props.imageClassName;

  const t = useTranslations("ui.lightbox");
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={t("open")}
        title={t("openTitle")}
        className={clsx(
          styles.imageLightbox__trigger,
          fit === "intrinsic" && styles.imageLightbox__triggerIntrinsic,
          triggerClassName,
        )}
        onClick={() => setOpen(true)}
      >
        <Image
          className={imageClassName}
          src={previewSrc}
          alt={alt}
          width={width}
          height={height}
          unoptimized
        />
      </button>

      <ImageViewer open={isOpen} src={src} alt={alt} onClose={() => setOpen(false)} />
    </>
  );
}
