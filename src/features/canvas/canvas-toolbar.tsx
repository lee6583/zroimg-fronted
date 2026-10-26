"use client";

import clsx from "clsx";
import Link from "next/link";
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
import { useRef, type ReactNode } from "react";
import { imageMimeTypes } from "@/utils/media";
import styles from "./canvas-editor.module.css";

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

const statusLabels: Record<SaveStatus, string> = {
  saved: "已保存",
  dirty: "未保存",
  saving: "保存中…",
  error: "保存失败",
  conflict: "画布已在其他窗口修改",
};

export function CanvasToolbar(props: CanvasToolbarProps) {
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
  const inputRef = useRef<HTMLInputElement>(null);

  const isProblem = saveStatus === "error" || saveStatus === "conflict";

  function pickFiles(files: FileList | null) {
    if (files) onUpload(Array.from(files));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={styles.toolbar}>
      <Link href="/canvas" aria-label="返回画布列表" className={styles.iconButton}>
        <ArrowLeft size={16} />
      </Link>
      <span className={styles.toolbar__title}>{title}</span>
      <span className={styles.toolbar__divider} />

      <ToolButton label="添加生成节点" onClick={onAddGenerator}>
        <Sparkles size={16} />
      </ToolButton>
      <ToolButton label="添加便签" onClick={onAddNote}>
        <StickyNote size={16} />
      </ToolButton>
      <ToolButton label="上传图片" onClick={() => inputRef.current?.click()}>
        <ImageUp size={16} />
      </ToolButton>
      <ToolButton label="从历史添加" onClick={onOpenHistory}>
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

      <ToolButton label="撤销" disabled={!canUndo} onClick={onUndo}>
        <Undo2 size={16} />
      </ToolButton>
      <ToolButton label="重做" disabled={!canRedo} onClick={onRedo}>
        <Redo2 size={16} />
      </ToolButton>
      <ToolButton label="适应视图" onClick={onFitView}>
        <Maximize size={16} />
      </ToolButton>
      <span className={styles.toolbar__divider} />

      <span className={clsx(styles.toolbar__status, isProblem && styles.textDanger)}>
        {statusLabels[saveStatus]}
      </span>
      {saveStatus === "conflict" ? (
        <button type="button" className={styles.secondaryButton} onClick={onReload}>
          重新加载
        </button>
      ) : null}
      <span className={styles.toolbar__balance}>余额 {balance} 积分</span>
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
