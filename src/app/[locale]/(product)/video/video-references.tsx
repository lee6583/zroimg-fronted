"use client";

import clsx from "clsx";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { ChangeEvent } from "react";
import { userAssetUrl } from "@/utils/media";
import { useVideoText } from "./video-text";
import styles from "./video.module.css";

type VideoReference = {
  id: string;
  name: string;
};

type PendingReference = {
  key: string;
  name: string;
  previewUrl: string;
};

type VideoReferencesProps = {
  references: VideoReference[];
  pending: PendingReference[];
  maxCount: number;
  isUploading: boolean;
  onUpload: (files: File[]) => void;
  onRemove: (id: string) => void;
};

/** 参考图上传区：按上传顺序显示缩略图，未满上限时末尾显示添加按钮。 */
export function VideoReferences(props: VideoReferencesProps) {
  const text = useVideoText();
  const t = text.t;
  const references = props.references;
  const maxCount = props.maxCount;
  const canAdd = references.length + props.pending.length < maxCount;
  const isMultiple = maxCount > 1;

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) {
      props.onUpload(files);
    }
  }

  let addLabel = t("settings.upload");
  if (props.isUploading) {
    addLabel = t("settings.uploading");
  } else if (isMultiple && references.length > 0) {
    addLabel = t("settings.addReference");
  }

  return (
    <ul className={styles.videoPage__referenceGrid}>
      {references.map((reference, index) => (
        <li key={reference.id} className={styles.videoPage__referenceItem}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 用户上传的私有媒体走 Java 接口，不经过 next/image */}
          <img
            className={styles.videoPage__referenceImage}
            src={userAssetUrl(reference.id)}
            alt={t("settings.referenceAlt", { index: index + 1 })}
            title={reference.name}
          />
          <span className={styles.videoPage__referenceIndex} aria-hidden>
            {index + 1}
          </span>
          <button
            type="button"
            className={styles.videoPage__referenceRemove}
            onClick={() => props.onRemove(reference.id)}
            aria-label={t("settings.removeReferenceAt", { index: index + 1 })}
            title={t("settings.removeReference")}
          >
            <X size={14} />
          </button>
        </li>
      ))}
      {props.pending.map((item) => (
        <li key={item.key} className={styles.videoPage__referenceItem} aria-busy>
          {/* eslint-disable-next-line @next/next/no-img-element -- 本地 blob 预览 */}
          <img
            className={clsx(styles.videoPage__referenceImage, styles.videoPage__referencePending)}
            src={item.previewUrl}
            alt={item.name}
          />
          <span className={styles.videoPage__referenceSpinner} aria-hidden>
            <Loader2 size={18} />
          </span>
        </li>
      ))}
      {canAdd ? (
        <li className={styles.videoPage__referenceItem}>
          <label className={styles.videoPage__referenceAdd} aria-busy={props.isUploading}>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple={isMultiple}
              className={styles.videoPage__fileInput}
              onChange={selectFiles}
              disabled={props.isUploading}
            />
            <ImagePlus size={18} />
            <span>{addLabel}</span>
          </label>
        </li>
      ) : null}
    </ul>
  );
}

export type { PendingReference, VideoReference };
