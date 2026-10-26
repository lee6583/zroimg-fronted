"use client";

import clsx from "clsx";
import {
  ArrowLeft,
  History,
  ImageUp,
  Maximize,
  Redo2,
  Sparkles,
  StickyNote,
  Undo2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, type ReactNode } from "react";
import { imageMimeTypes } from "@/utils/media";
import styles from "./canvas-editor.module.css";
import { Link } from "@/i18n/navigation";

type SaveStatus = "saved" | "dirty" | "saving" | "error" | "conflict";

type CanvasToolbarProps = {
  title: string;
  balance: number;
  saveStatus: SaveStatus;
  canUndo: boolean;
  canRedo: boolean;
  onAddGenerator: () => void;
  onAddNote: () => void;
  onUpload: (files: File[]) => void;
  onOpenHistory: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onFitView: () => void;
  onReload: () => void;
};

type ToolButtonProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
};

// full：桌面端顶部完整工具栏；header / tools：手机端拆成顶部标题条和底部浮动工具栏。
type CanvasToolbarVariant = "full" | "header" | "tools";

export function CanvasToolbar(props: CanvasToolbarProps & { variant?: CanvasToolbarVariant }) {
  const variant = props.variant ?? "full";
  const title = props.title;
  const balance = props.balance;
  const saveStatus = props.saveStatus;
  const canUndo = props.canUndo;
  const canRedo = props.canRedo;
  const onAddGenerator = props.onAddGenerator;
  const onAddNote = props.onAddNote;
  const onUpload = props.onUpload;
  const onOpenHistory = props.onOpenHistory;
  const onUndo = props.onUndo;
  const onRedo = props.onRedo;
  const onFitView = props.onFitView;
  const onReload = props.onReload;
  const t = useTranslations("canvas.toolbar");
  const inputRef = useRef<HTMLInputElement>(null);

  const isProblem = saveStatus === "error" || saveStatus === "conflict";
  const showHeader = variant !== "tools";
  const showTools = variant !== "header";

  function pickFiles(files: FileList | null) {
    if (files) onUpload(Array.from(files));
    if (inputRef.current) inputRef.current.value = "";
  }

  const statusText = t(`status.${saveStatus}`);
  const balanceText = t("balance", { points: balance });

  return (
    <div
      className={clsx(
        styles.toolbar,
        variant === "header" && styles.toolbarHeader,
        variant === "tools" && styles.toolbarTools,
      )}
    >
      {showHeader ? (
        <>
          <Link
            href="/canvas"
            aria-label={t("back")}
            title={t("back")}
            className={styles.iconButton}
          >
            <ArrowLeft size={16} />
          </Link>
          <span className={styles.toolbar__title} title={title}>
            {title}
          </span>
        </>
      ) : null}
      {variant === "full" ? <span className={styles.toolbar__divider} /> : null}

      {showTools ? (
        <>
          <ToolButton label={t("addGenerator")} onClick={onAddGenerator}>
            <Sparkles size={16} />
          </ToolButton>
          <ToolButton label={t("addNote")} onClick={onAddNote}>
            <StickyNote size={16} />
          </ToolButton>
          <ToolButton label={t("upload")} onClick={() => inputRef.current?.click()}>
            <ImageUp size={16} />
          </ToolButton>
          <ToolButton label={t("history")} onClick={onOpenHistory}>
            <History size={16} />
          </ToolButton>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept={imageMimeTypes.join(",")}
            onChange={(event) => pickFiles(event.target.files)}
          />
          <span className={styles.toolbar__divider} />

          <ToolButton label={t("undo")} disabled={!canUndo} onClick={onUndo}>
            <Undo2 size={16} />
          </ToolButton>
          <ToolButton label={t("redo")} disabled={!canRedo} onClick={onRedo}>
            <Redo2 size={16} />
          </ToolButton>
          <ToolButton label={t("fitView")} onClick={onFitView}>
            <Maximize size={16} />
          </ToolButton>
        </>
      ) : null}
      {variant === "full" ? <span className={styles.toolbar__divider} /> : null}

      {showHeader ? (
        <>
          <span
            className={clsx(styles.toolbar__status, isProblem && styles.textDanger)}
            title={statusText}
          >
            {statusText}
          </span>
          {saveStatus === "conflict" ? (
            <button type="button" className={styles.secondaryButton} onClick={onReload}>
              {t("reload")}
            </button>
          ) : null}
          <span className={styles.toolbar__balance} title={balanceText}>
            {balanceText}
          </span>
        </>
      ) : null}
    </div>
  );
}

function ToolButton(props: ToolButtonProps) {
  const label = props.label;
  const disabled = props.disabled ?? false;
  const onClick = props.onClick;
  const children = props.children;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={styles.iconButton}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export type { SaveStatus };
