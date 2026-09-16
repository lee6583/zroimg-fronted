"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

export function ImageLightbox(props: ImageLightboxProps) {
  const src = props.src;
  const previewSrc = props.previewSrc ?? src;
  const alt = props.alt;
  const width = props.width;
  const height = props.height;
  const fit = props.fit ?? "container";
  const triggerClassName = props.triggerClassName;
  const imageClassName = props.imageClassName;

  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeByEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeByEscape);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        aria-label="放大查看图片"
        title="放大查看"
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

      {isOpen
        ? createPortal(
            <div
              className={styles.imageLightbox__overlay}
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <div
                className={styles.imageLightbox__viewer}
                role="dialog"
                aria-modal="true"
                aria-label="图片预览"
              >
                <Image
                  className={styles.imageLightbox__image}
                  src={src}
                  alt={alt}
                  width={width}
                  height={height}
                  unoptimized
                />
              </div>
              <button
                type="button"
                aria-label="关闭图片预览"
                title="关闭"
                className={styles.imageLightbox__close}
                onClick={() => setOpen(false)}
              >
                <X size={20} />
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
