"use client";

import clsx from "clsx";
import { Brush, Download, LoaderCircle, Maximize2, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";
import { Handle, NodeToolbar, Position, type NodeProps } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { ImageViewer } from "@/components/ui/image-lightbox";
import { userAssetDownloadUrl, userAssetUrl } from "@/utils/media";
import { useCanvasActions } from "../canvas-context";
import { getImageHeight, imageNodeWidth, type ImageNode } from "../canvas-model";
import { useCanvasStoreApi } from "../canvas-store";
import styles from "../canvas-editor.module.css";

export function getImageSrc(data: ImageNode["data"]) {
  if (data.mediaAssetId) {
    return userAssetUrl(data.mediaAssetId);
  }

  return data.url;
}

export function CanvasImageNode(props: NodeProps<ImageNode>) {
  const id = props.id;
  const data = props.data;
  const selected = props.selected;
  const actions = useCanvasActions();
  const store = useCanvasStoreApi();
  const t = useTranslations("canvas.image");
  const [isViewing, setViewing] = useState(false);

  const src = getImageSrc(data);
  const hasSize = Boolean(data.width && data.height);
  const height = getImageHeight(data.width, data.height);
  const isReady = Boolean(data.mediaAssetId) && !data.isUploading;
  let sizeLabel = "";
  if (hasSize) {
    sizeLabel = `${data.width} × ${data.height}`;
  }

  // 生成结果没有返回尺寸，图片加载后补齐，用于展示和布局
  function readSize(image: HTMLImageElement) {
    if (hasSize || !data.mediaAssetId || !image.naturalWidth) return;

    store.getState().patchNode(id, { width: image.naturalWidth, height: image.naturalHeight });
  }

  return (
    <div className={clsx(styles.node, styles.imageNode, selected && styles.nodeSelected)}>
      <NodeToolbar isVisible={selected && isReady} position={Position.Top} offset={10}>
        <div className={styles.nodeToolbar}>
          <button
            aria-label={t("view")}
            title={t("view")}
            type="button"
            className={styles.nodeToolbar__button}
            onClick={() => setViewing(true)}
          >
            <Maximize2 size={14} />
            <span className={styles.nodeToolbar__label}>{t("view")}</span>
          </button>
          <button
            aria-label={t("generateFrom")}
            title={t("generateFrom")}
            type="button"
            className={styles.nodeToolbar__button}
            onClick={() => actions.generateFrom(id)}
          >
            <Sparkles size={14} />
            <span className={styles.nodeToolbar__label}>{t("generateFrom")}</span>
          </button>
          <button
            aria-label={t("inpaint")}
            title={t("inpaint")}
            type="button"
            className={styles.nodeToolbar__button}
            onClick={() => actions.inpaint(id)}
          >
            <Brush size={14} />
            <span className={styles.nodeToolbar__label}>{t("inpaint")}</span>
          </button>
          {data.mediaAssetId ? (
            <a
              aria-label={t("download")}
              title={t("download")}
              className={styles.nodeToolbar__button}
              href={userAssetDownloadUrl(data.mediaAssetId)}
              download={data.name ?? `canvas-${id}.png`}
            >
              <Download size={14} />
              <span className={styles.nodeToolbar__label}>{t("download")}</span>
            </a>
          ) : null}
          <button
            aria-label={t("delete")}
            title={t("delete")}
            type="button"
            className={clsx(styles.nodeToolbar__button, styles.nodeToolbar__danger)}
            onClick={() => actions.remove(id)}
          >
            <Trash2 size={14} />
            <span className={styles.nodeToolbar__label}>{t("delete")}</span>
          </button>
        </div>
      </NodeToolbar>

      <Handle
        type="target"
        position={Position.Left}
        isConnectable={false}
        className={styles.handleHidden}
      />
      <div
        className={styles.imageNode__frame}
        style={{ width: imageNodeWidth, height: hasSize ? height : undefined }}
        onDoubleClick={(event) => {
          // 双击图片放大查看；阻止冒泡，避免画布把双击当成缩放
          event.stopPropagation();
          if (src && isReady) setViewing(true);
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.imageNode__image}
            src={src}
            alt={data.name ?? ""}
            draggable={false}
            onLoad={(event) => readSize(event.currentTarget)}
          />
        ) : null}
        {data.isUploading ? (
          <div className={styles.imageNode__uploading}>
            <LoaderCircle size={18} className={styles.spin} />
            {t("uploading")}
          </div>
        ) : null}
      </div>
      {sizeLabel ? <p className={styles.imageNode__meta}>{sizeLabel}</p> : null}
      {src ? (
        <ImageViewer
          open={isViewing}
          src={src}
          alt={data.name ?? ""}
          onClose={() => setViewing(false)}
        />
      ) : null}
      <Handle type="source" position={Position.Right} className={styles.handle} />
    </div>
  );
}
