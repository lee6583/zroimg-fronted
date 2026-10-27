"use client";

import clsx from "clsx";
import { LoaderCircle, WandSparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PromptPolish } from "./use-prompt-polish";
import styles from "./polish-button.module.css";

type PolishButtonProps = {
  polish: PromptPolish;
  // compact：画布节点内的小尺寸按钮
  size?: "default" | "compact";
  // 提示气泡在按钮上方，默认居中；end 与按钮右侧对齐（靠近容器右边缘时使用）
  tooltipAlign?: "center" | "end";
  disabled?: boolean;
  className?: string;
};

/** AI 润色按钮：悬浮显示消耗积分；后台关闭时不渲染。 */
export function PolishButton(props: PolishButtonProps) {
  const polish = props.polish;
  const size = props.size ?? "default";
  const t = useTranslations("ui.polish");
  if (!polish.isEnabled) return null;

  let label = t("tooltip", { points: polish.points });
  if (polish.isPolishing) {
    label = t("polishing");
  } else if (polish.usesReferences) {
    label = t("tooltipWithReferences", { points: polish.points });
  }

  return (
    <span className={clsx(styles.polish, props.className)}>
      <button
        type="button"
        className={clsx(
          "nodrag",
          styles.polish__button,
          size === "compact" && styles.polish__buttonCompact,
        )}
        aria-label={label}
        aria-busy={polish.isPolishing}
        disabled={props.disabled || polish.isPolishing}
        onClick={() => void polish.polish()}
      >
        {polish.isPolishing ? (
          <LoaderCircle size={16} className={styles.polish__spin} aria-hidden />
        ) : (
          <WandSparkles size={size === "compact" ? 15 : 17} aria-hidden />
        )}
      </button>
      <span
        role="tooltip"
        className={clsx(
          styles.polish__tooltip,
          props.tooltipAlign === "end" && styles.polish__tooltipEnd,
        )}
      >
        {label}
      </span>
    </span>
  );
}
