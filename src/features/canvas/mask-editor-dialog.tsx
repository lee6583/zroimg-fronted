"use client";

import clsx from "clsx";
import { Brush, Eraser, Trash2, Undo2, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { uploadMediaFile } from "@/api/media/uploads";
import type { MediaAsset } from "@/types/generation";
import { getErrorMessage } from "@/utils/error";
import {
  clampBrushSize,
  defaultBrushSize,
  drawMask,
  extendStroke,
  hasPaint,
  maxBrushSize,
  minBrushSize,
  startStroke,
} from "./mask-model";
import type { MaskSize, MaskStroke, MaskTool } from "./mask-model";
import styles from "./mask-editor-dialog.module.css";

const MaskEditorCanvas = dynamic(
  () => import("./mask-editor-canvas").then((mod) => mod.MaskEditorCanvas),
  {
    ssr: false,
    loading: () => <span className={styles.maskEditor__status}>画板加载中</span>,
  },
);

type MaskEditorDialogProps = {
  open: boolean;
  imageUrl: string;
  width: number | null;
  height: number | null;
  onCancel: () => void;
  onConfirm: (mask: MediaAsset) => void;
};

type MaskEditorProps = Omit<MaskEditorDialogProps, "open">;

async function createMaskFile(strokes: MaskStroke[], size: MaskSize) {
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("当前浏览器无法生成遮罩");
  }

  drawMask(context, strokes, size);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) {
    throw new Error("遮罩生成失败，请重试");
  }

  return new File([blob], "mask.png", { type: "image/png" });
}

function MaskEditor(props: MaskEditorProps) {
  const imageUrl = props.imageUrl;
  const width = props.width;
  const height = props.height;
  const onCancel = props.onCancel;
  const onConfirm = props.onConfirm;

  const [strokes, setStrokes] = useState<MaskStroke[]>([]);
  const [tool, setTool] = useState<MaskTool>("brush");
  const [size, setSize] = useState(defaultBrushSize);
  const [imageSize, setImageSize] = useState<MaskSize | null>(null);
  const [isLoadFailed, setLoadFailed] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onCancel();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeByEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeByEscape);
    };
  }, [isSaving, onCancel]);

  const startDraw = useCallback(
    (x: number, y: number) => {
      setMessage("");
      setStrokes((current) => [...current, startStroke(tool, size, x, y)]);
    },
    [tool, size],
  );

  const moveDraw = useCallback((x: number, y: number) => {
    setStrokes((current) => {
      const last = current[current.length - 1];
      if (!last) return current;

      const rest = current.slice(0, -1);
      return [...rest, extendStroke(last, x, y)];
    });
  }, []);

  const loadImage = useCallback((nextSize: MaskSize) => {
    setImageSize(nextSize);
  }, []);

  const failImage = useCallback(() => {
    setLoadFailed(true);
  }, []);

  function undo() {
    setStrokes((current) => current.slice(0, -1));
  }

  function clear() {
    setStrokes([]);
  }

  async function confirm() {
    if (!imageSize) return;
    if (!hasPaint(strokes)) {
      setMessage("请先涂抹需要重绘的区域");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const file = await createMaskFile(strokes, imageSize);
      const asset = await uploadMediaFile(file);
      onConfirm(asset);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const canEdit = !isSaving && !isLoadFailed;
  const canConfirm = canEdit && Boolean(imageSize);

  return (
    <div
      className={styles.maskEditor__overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onCancel();
      }}
    >
      <section
        className={styles.maskEditor}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mask-editor-title"
      >
        <header className={styles.maskEditor__header}>
          <h2 id="mask-editor-title" className={styles.maskEditor__title}>
            局部重绘
          </h2>
          <button
            type="button"
            className={styles.maskEditor__iconButton}
            aria-label="关闭"
            title="关闭"
            disabled={isSaving}
            onClick={onCancel}
          >
            <X size={16} />
          </button>
        </header>

        <div className={styles.maskEditor__toolbar}>
          <div className={styles.maskEditor__tools} role="group" aria-label="涂抹工具">
            <button
              type="button"
              className={clsx(
                styles.maskEditor__tool,
                tool === "brush" && styles.maskEditor__toolActive,
              )}
              aria-pressed={tool === "brush"}
              disabled={!canEdit}
              onClick={() => setTool("brush")}
            >
              <Brush size={15} aria-hidden="true" />
              画笔
            </button>
            <button
              type="button"
              className={clsx(
                styles.maskEditor__tool,
                tool === "eraser" && styles.maskEditor__toolActive,
              )}
              aria-pressed={tool === "eraser"}
              disabled={!canEdit}
              onClick={() => setTool("eraser")}
            >
              <Eraser size={15} aria-hidden="true" />
              橡皮擦
            </button>
          </div>

          <label className={styles.maskEditor__size}>
            <span>笔刷</span>
            <input
              type="range"
              min={minBrushSize}
              max={maxBrushSize}
              step={2}
              value={size}
              disabled={!canEdit}
              onChange={(event) => setSize(clampBrushSize(Number(event.target.value)))}
            />
            <span className={styles.maskEditor__sizeValue}>{size}px</span>
          </label>

          <div className={styles.maskEditor__tools}>
            <button
              type="button"
              className={styles.maskEditor__iconButton}
              aria-label="撤销"
              title="撤销"
              disabled={!canEdit || strokes.length === 0}
              onClick={undo}
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              className={styles.maskEditor__iconButton}
              aria-label="清空"
              title="清空"
              disabled={!canEdit || strokes.length === 0}
              onClick={clear}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        <div className={styles.maskEditor__body}>
          {isLoadFailed ? (
            <span className={styles.maskEditor__status}>图片加载失败</span>
          ) : (
            <MaskEditorCanvas
              imageUrl={imageUrl}
              width={width}
              height={height}
              strokes={strokes}
              tool={tool}
              size={size}
              onStart={startDraw}
              onMove={moveDraw}
              onLoad={loadImage}
              onError={failImage}
            />
          )}
        </div>

        <footer className={styles.maskEditor__footer}>
          <p className={styles.maskEditor__message} role="status">
            {message}
          </p>
          <div className={styles.maskEditor__actions}>
            <button type="button" className="btn-secondary" disabled={isSaving} onClick={onCancel}>
              取消
            </button>
            <button type="button" className="btn-primary" disabled={!canConfirm} onClick={confirm}>
              {isSaving ? "上传中" : "确认"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

export function MaskEditorDialog(props: MaskEditorDialogProps) {
  const open = props.open;
  const imageUrl = props.imageUrl;
  const width = props.width;
  const height = props.height;
  const onCancel = props.onCancel;
  const onConfirm = props.onConfirm;

  if (!open) return null;

  return (
    <MaskEditor
      key={imageUrl}
      imageUrl={imageUrl}
      width={width}
      height={height}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
