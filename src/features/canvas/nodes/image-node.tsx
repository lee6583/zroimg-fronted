"use client";

import clsx from "clsx";
import {
  Brush,
  Download,
  LoaderCircle,
  Maximize2,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Handle, NodeToolbar, Position, useStore, type NodeProps } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { ImageViewer } from "@/components/ui/image-lightbox";
import {
  userAssetDownloadUrl,
  userAssetPreviewUrl,
  userAssetThumbnailUrl,
  userAssetUrl,
} from "@/utils/media";
import { useCanvasActions } from "../canvas-context";
import { imageNodeWidth, type ImageNode } from "../canvas-model";
import { useIsPriority, useMediaPreview } from "../canvas-previews";
import { useCanvasStoreApi } from "../canvas-store";
import { getFrameRatio, shouldUsePreview, withRetry } from "../image-loading";
import styles from "../canvas-editor.module.css";

// 原图地址：只用于查看大图、下载、遮罩编辑和局部重绘，画布上不直接加载
export function getImageSrc(data: ImageNode["data"]) {
  if (data.mediaAssetId) {
    return userAssetUrl(data.mediaAssetId);
  }

  return data.url;
}

// 画布上显示的缩略图地址（最长边 768）
export function getThumbnailSrc(data: ImageNode["data"]) {
  if (data.mediaAssetId) {
    return userAssetThumbnailUrl(data.mediaAssetId);
  }

  return data.url;
}

// 已解码过预览图的资源：节点滚出视口被卸载、再滚回来时直接用预览图，不再从缩略图重新升级
const decodedPreviews = new Set<string>();

function subscribePixelRatio() {
  return () => {};
}

function readPixelRatio() {
  return window.devicePixelRatio || 1;
}

function readServerPixelRatio() {
  return 1;
}

type ImageFrameProps = {
  nodeId: string;
  data: ImageNode["data"];
  isActive: boolean;
  isReady: boolean;
  onView: () => void;
};

function ImageFrame(props: ImageFrameProps) {
  const nodeId = props.nodeId;
  const data = props.data;
  const isActive = props.isActive;
  const isReady = props.isReady;
  const onView = props.onView;
  const t = useTranslations("canvas.image");
  const preview = useMediaPreview(data.mediaAssetId);
  const isPriority = useIsPriority(nodeId);
  const pixelRatio = useSyncExternalStore(
    subscribePixelRatio,
    readPixelRatio,
    readServerPixelRatio,
  );
  // 选择器只返回布尔值：缩放过程中只有跨过阈值时才重新渲染
  const wantsPreview = useStore((state) => {
    const decision = {
      zoom: state.transform[2],
      cssWidth: imageNodeWidth,
      pixelRatio,
      isActive,
    };
    return shouldUsePreview(decision);
  });
  const [attempt, setAttempt] = useState(0);
  const [isLoaded, setLoaded] = useState(false);
  const [isFailed, setFailed] = useState(false);
  const mediaAssetId = data.mediaAssetId;
  const [previewSrc, setPreviewSrc] = useState<string | null>(() => {
    if (!mediaAssetId || !decodedPreviews.has(mediaAssetId)) return null;

    return userAssetPreviewUrl(mediaAssetId);
  });

  const thumbnail = getThumbnailSrc(data);
  const ratio = getFrameRatio(data.width, data.height, preview?.thumbWidth, preview?.thumbHeight);
  const lqip = preview?.lqip ?? null;

  // 需要更清晰时先在后台加载并解码预览图，完成后再替换，避免闪白
  useEffect(() => {
    if (!wantsPreview || !mediaAssetId || previewSrc) return;

    let isCancelled = false;
    const url = userAssetPreviewUrl(mediaAssetId);
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    image
      .decode()
      .then(() => {
        decodedPreviews.add(mediaAssetId);
        if (!isCancelled) setPreviewSrc(url);
      })
      .catch(() => {
        // 预览图失败时继续显示缩略图
      });

    return () => {
      isCancelled = true;
    };
  }, [wantsPreview, mediaAssetId, previewSrc]);

  let src: string | null = null;
  if (previewSrc) {
    src = previewSrc;
  } else if (thumbnail) {
    src = withRetry(thumbnail, attempt);
  }

  function retry() {
    setFailed(false);
    setLoaded(false);
    setAttempt((current) => current + 1);
  }

  let loading: "eager" | "lazy" = "lazy";
  let priority: "high" | "auto" = "auto";
  if (isPriority) {
    loading = "eager";
    priority = "high";
  }

  return (
    <div
      className={styles.imageNode__frame}
      style={{ width: imageNodeWidth, aspectRatio: ratio }}
      onDoubleClick={(event) => {
        // 双击图片放大查看；阻止冒泡，避免画布把双击当成缩放
        event.stopPropagation();
        if (src && isReady) onView();
      }}
    >
      {lqip ? (
        <div
          aria-hidden
          className={styles.imageNode__placeholder}
          style={{ backgroundImage: `url("${lqip}")` }}
        />
      ) : null}
      {src && !isFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={attempt}
          className={clsx(styles.imageNode__image, isLoaded && styles.imageNode__imageLoaded)}
          src={src}
          alt={data.name ?? ""}
          draggable={false}
          loading={loading}
          decoding="async"
          fetchPriority={priority}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      ) : null}
      {isFailed ? (
        <button
          type="button"
          className={clsx("nodrag", styles.imageNode__retry)}
          aria-label={t("retry")}
          title={t("retry")}
          onClick={(event) => {
            event.stopPropagation();
            retry();
          }}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <RotateCcw size={14} />
          {t("retry")}
        </button>
      ) : null}
      {data.isUploading ? (
        <div className={styles.imageNode__uploading}>
          <LoaderCircle size={18} className={styles.spin} />
          {t("uploading")}
        </div>
      ) : null}
    </div>
  );
}

export function CanvasImageNode(props: NodeProps<ImageNode>) {
  const id = props.id;
  const data = props.data;
  const selected = props.selected;
  const actions = useCanvasActions();
  const store = useCanvasStoreApi();
  const t = useTranslations("canvas.image");
  const [isViewing, setViewing] = useState(false);

  const [isHovered, setHovered] = useState(false);
  const preview = useMediaPreview(data.mediaAssetId);

  const src = getImageSrc(data);
  const hasSize = Boolean(data.width && data.height);
  const isReady = Boolean(data.mediaAssetId) && !data.isUploading;
  let sizeLabel = "";
  if (hasSize) {
    sizeLabel = `${data.width} × ${data.height}`;
  }

  // 生成结果没有返回尺寸：用批量预览接口返回的原图尺寸补齐（遮罩编辑需要原图分辨率，不能用缩略图尺寸）
  const previewWidth = preview?.width ?? 0;
  const previewHeight = preview?.height ?? 0;
  useEffect(() => {
    if (hasSize || !data.mediaAssetId || previewWidth <= 0 || previewHeight <= 0) return;

    store.getState().patchNode(id, { width: previewWidth, height: previewHeight });
  }, [hasSize, data.mediaAssetId, previewWidth, previewHeight, id, store]);

  return (
    <div
      className={clsx(styles.node, styles.imageNode, selected && styles.nodeSelected)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
      <ImageFrame
        nodeId={id}
        data={data}
        isActive={Boolean(selected) || isHovered}
        isReady={isReady}
        onView={() => setViewing(true)}
      />
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
