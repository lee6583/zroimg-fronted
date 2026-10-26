"use client";

import clsx from "clsx";
import { Play, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import lightbox from "./image-lightbox.module.css";
import styles from "./video-lightbox.module.css";

type VideoLightboxProps = {
  src: string;
  label: string;
  triggerClassName?: string;
};

export function VideoLightbox(props: VideoLightboxProps) {
  const src = props.src;
  const label = props.label;
  const triggerClassName = props.triggerClassName;

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
        aria-label="播放视频"
        title={label}
        className={clsx(
          lightbox.imageLightbox__trigger,
          styles.videoLightbox__trigger,
          triggerClassName,
        )}
        onClick={() => setOpen(true)}
      >
        {/* #t 让浏览器停在首帧附近，作为缩略图 */}
        <video
          className={styles.videoLightbox__thumb}
          src={`${src}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          tabIndex={-1}
        />
        <span className={styles.videoLightbox__badge}>
          <Play size={10} fill="currentColor" />
        </span>
      </button>

      {isOpen
        ? createPortal(
            <div
              className={lightbox.imageLightbox__overlay}
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <div
                className={lightbox.imageLightbox__viewer}
                role="dialog"
                aria-modal="true"
                aria-label="视频预览"
              >
                <video
                  className={styles.videoLightbox__player}
                  src={src}
                  controls
                  autoPlay
                  playsInline
                />
              </div>
              <button
                type="button"
                aria-label="关闭视频预览"
                title="关闭"
                className={lightbox.imageLightbox__close}
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
