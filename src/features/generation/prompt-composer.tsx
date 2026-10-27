"use client";

import clsx from "clsx";
import { getPastedImages } from "@/utils/clipboard-images";
import {
  ArrowUp,
  ImagePlus,
  MessageSquarePlus,
  RefreshCw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { RefObject } from "react";
import { PolishButton } from "@/features/polish/polish-button";
import type { PromptPolish } from "@/features/polish/use-prompt-polish";
import type { GenerationMode, MediaAsset } from "@/types/generation";
import type { Notice } from "./generation-model";
import styles from "./generate-form.module.css";

type PromptComposerProps = {
  inputs: MediaAsset[];
  prompt: string;
  mode: GenerationMode;
  estimate: number;
  hasCostError: boolean;
  notice: Notice;
  isBusy: boolean;
  isBlocked: boolean;
  isCreating: boolean;
  // 手机/平板上设置入口在输入框里，显示当前模型 · 比例 · 分辨率 · 数量。
  settingsSummary: string;
  onOpenSettings: () => void;
  onPromptChange: (value: string) => void;
  onFiles: (files: FileList | null) => Promise<void>;
  onRemove: (id: string) => void;
  onNew: () => Promise<unknown>;
  onSubmit: () => Promise<void>;
  // AI 润色：按钮在上传参考图右侧
  polish: PromptPolish;
  textarea: RefObject<HTMLTextAreaElement | null>;
};

export function PromptComposer({ textarea, ...props }: PromptComposerProps) {
  const inputs = props.inputs;
  const prompt = props.prompt;
  const mode = props.mode;
  const estimate = props.estimate;
  const hasCostError = props.hasCostError;
  const notice = props.notice;
  const isBusy = props.isBusy;
  const isBlocked = props.isBlocked;
  const isCreating = props.isCreating;
  const onPromptChange = props.onPromptChange;
  const onFiles = props.onFiles;
  const onRemove = props.onRemove;
  const onNew = props.onNew;
  const onSubmit = props.onSubmit;
  const settingsSummary = props.settingsSummary;
  const onOpenSettings = props.onOpenSettings;
  const polish = props.polish;
  const t = useTranslations("generate");
  let placeholder = t("composer.placeholder");
  if (mode === "image_to_image") {
    placeholder = t("composer.placeholderEdit");
  }
  let costText = t("composer.cost", { points: estimate });
  if (hasCostError) {
    costText = t("composer.insufficient");
  }

  return (
    <div className={styles.generateForm__composerBar}>
      <div className={styles.generateForm__composer}>
        {inputs.length ? (
          <div className={styles.generateForm__inputChips}>
            {inputs.map((item) => (
              <span key={item.id} className={styles.generateForm__inputChip}>
                <span
                  className={styles.generateForm__inputChipName}
                  title={item.originalName || undefined}
                >
                  {item.originalName || t("composer.referenceName", { id: item.id.slice(0, 5) })}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className={styles.generateForm__chipRemove}
                  aria-label={t("composer.removeReference")}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <textarea
          ref={textarea}
          className={styles.generateForm__textarea}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onPaste={(event) => {
            // 粘贴剪贴板里的图片，等同于点"上传参考图"
            const images = getPastedImages(event.clipboardData);
            if (images.length === 0) return;
            event.preventDefault();
            const transfer = new DataTransfer();
            for (const image of images) transfer.items.add(image);
            void onFiles(transfer.files);
          }}
          placeholder={placeholder}
        />

        <div className={styles.generateForm__composerFooter}>
          <div className={styles.generateForm__composerActions}>
            <button
              type="button"
              onClick={() => void onNew()}
              disabled={isCreating || isBusy}
              className={clsx(
                styles.generateForm__composerButton,
                styles.generateForm__newChatComposerButton,
              )}
            >
              <MessageSquarePlus size={16} />
              {t("conversation.create")}
            </button>
            <label
              className={styles.generateForm__uploadButton}
              aria-label={t("composer.upload")}
              title={t("composer.upload")}
            >
              <ImagePlus size={18} />
              <input
                className={styles.generateForm__hiddenInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => {
                  void onFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            <PolishButton polish={polish} disabled={isBusy} />
            <button
              type="button"
              onClick={onOpenSettings}
              className={styles.generateForm__settingsChip}
              aria-label={t("composer.openSettings")}
              title={settingsSummary}
            >
              <SlidersHorizontal size={15} aria-hidden />
              <span className={styles.generateForm__settingsChipText}>{settingsSummary}</span>
            </button>
          </div>

          <div className={styles.generateForm__submitArea}>
            <span
              className={clsx(
                styles.generateForm__costLabel,
                hasCostError && styles.generateForm__costLabelError,
              )}
            >
              {costText}
            </span>
            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={isBusy || isBlocked || !prompt.trim()}
              className={styles.generateForm__submitButton}
              aria-label={t("composer.submit")}
              title={t("composer.submit")}
            >
              {isBusy ? (
                <RefreshCw size={17} className={styles.generateForm__spinning} />
              ) : (
                <ArrowUp size={18} />
              )}
            </button>
          </div>
        </div>

        {notice ? (
          <p
            className={clsx(
              styles.generateForm__message,
              notice.tone === "info"
                ? styles.generateForm__messageInfo
                : styles.generateForm__messageError,
            )}
          >
            {notice.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
