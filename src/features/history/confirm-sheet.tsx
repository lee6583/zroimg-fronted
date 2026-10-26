"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { Sheet } from "@/components/ui/sheet";
import styles from "./confirm-sheet.module.css";

type ConfirmSheetProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  isLoading?: boolean;
  isDanger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/** 二次确认：手机底部弹出，桌面居中对话框。删除、取消公开等不可逆操作使用。 */
export function ConfirmSheet(props: ConfirmSheetProps) {
  const isLoading = props.isLoading ?? false;

  return (
    <Sheet
      open={props.open}
      onClose={props.onClose}
      title={props.title}
      isLocked={isLoading}
      className={styles.confirmSheet}
      footer={
        <div className={styles.confirmSheet__actions}>
          <button
            type="button"
            className={clsx("btn-secondary", styles.confirmSheet__button)}
            onClick={props.onClose}
            disabled={isLoading}
          >
            {props.cancelLabel}
          </button>
          <button
            type="button"
            className={clsx(
              "btn-primary",
              styles.confirmSheet__button,
              props.isDanger && styles.confirmSheet__danger,
            )}
            onClick={props.onConfirm}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {props.confirmLabel}
          </button>
        </div>
      }
    >
      <div className={styles.confirmSheet__text}>{props.children}</div>
    </Sheet>
  );
}
