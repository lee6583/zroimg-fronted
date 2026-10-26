"use client";

import { useEffect, useId, useRef, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import styles from "./sheet.module.css";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  // 桌面端的呈现方式：居中对话框或右侧抽屉；手机端（< 768px）始终是底部弹出面板。
  desktop?: "dialog" | "drawer";
  // 处理中（例如正在提交）时禁止点遮罩 / Esc 关闭。
  isLocked?: boolean;
  className?: string;
};

const mobileQuery = "(max-width: 767px)";

function subscribeMobile(callback: () => void) {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getMobile() {
  return window.matchMedia(mobileQuery).matches;
}

function getServerMobile() {
  return false;
}

/** 当前是否为手机宽度（< 768px）。服务端与首次渲染返回 false。 */
export function useIsMobile() {
  return useSyncExternalStore(subscribeMobile, getMobile, getServerMobile);
}

function subscribeNothing() {
  return () => undefined;
}

function useIsClient() {
  return useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
}

/**
 * 响应式弹层：手机端从底部滑出（带拖拽条、适配安全区），桌面端为居中对话框或右侧抽屉。
 * 用户端页面里的确认框、设置面板、详情弹层统一用它，不要再各写一套遮罩。
 */
export function Sheet(props: SheetProps) {
  const open = props.open;
  const onClose = props.onClose;
  const isLocked = props.isLocked ?? false;
  const desktop = props.desktop ?? "dialog";
  const t = useTranslations("common");
  const isClient = useIsClient();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !isLocked) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open, isLocked, onClose]);

  if (!isClient || !open) {
    return null;
  }

  return createPortal(
    <div className={clsx(styles.sheet, desktop === "drawer" && styles.sheetDrawer)}>
      <div
        className={styles.sheet__backdrop}
        aria-hidden
        onClick={() => {
          if (!isLocked) onClose();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={props.title ? titleId : undefined}
        tabIndex={-1}
        className={clsx(styles.sheet__panel, props.className)}
      >
        <span className={styles.sheet__handle} aria-hidden />
        <header className={styles.sheet__header}>
          {props.title ? (
            <h2 id={titleId} className={styles.sheet__title}>
              {props.title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            className={styles.sheet__close}
            onClick={onClose}
            disabled={isLocked}
            aria-label={t("actions.close")}
          >
            <X size={18} />
          </button>
        </header>
        <div className={styles.sheet__body}>{props.children}</div>
        {props.footer ? <footer className={styles.sheet__footer}>{props.footer}</footer> : null}
      </div>
    </div>,
    document.body,
  );
}
