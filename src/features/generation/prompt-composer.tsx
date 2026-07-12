"use client";

import clsx from "clsx";
import { ArrowUp, ImagePlus, MessageSquarePlus, RefreshCw, X } from "lucide-react";
import type { GenerationMode } from "@/types/generation";
import type { MediaInput, Notice } from "./generation-model";
import styles from "./generate-form.module.css";

type PromptComposerProps = {
  inputs: MediaInput[];
  prompt: string;
  mode: GenerationMode;
  estimate: number;
  notice: Notice;
  isBusy: boolean;
  onPromptChange: (value: string) => void;
  onFiles: (files: FileList | null) => Promise<void>;
  onRemove: (id: string) => void;
  onNew: () => Promise<unknown>;
  onSubmit: () => Promise<void>;
};

export function PromptComposer(props: PromptComposerProps) {
  const inputs = props.inputs;
  const prompt = props.prompt;
  const mode = props.mode;
  const estimate = props.estimate;
  const notice = props.notice;
  const isBusy = props.isBusy;
  const onPromptChange = props.onPromptChange;
  const onFiles = props.onFiles;
  const onRemove = props.onRemove;
  const onNew = props.onNew;
  const onSubmit = props.onSubmit;

  return (
    <div className={styles.generateForm__composerBar}>
      <div className={styles.generateForm__composer}>
        {inputs.length ? (
          <div className={styles.generateForm__inputChips}>
            {inputs.map((item) => (
              <span key={item.id} className={styles.generateForm__inputChip}>
                <span className={styles.generateForm__inputChipName}>
                  {item.fileName || `参考图 ${item.id.slice(0, 5)}`}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  className={styles.generateForm__chipRemove}
                  aria-label="移除参考图"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        <textarea
          className={styles.generateForm__textarea}
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder={mode === "text" ? "描述你想要的图片..." : "描述你想让参考图发生什么变化..."}
        />

        <div className={styles.generateForm__composerFooter}>
          <div className={styles.generateForm__composerActions}>
            <button
              type="button"
              onClick={() => void onNew()}
              className={clsx(
                styles.generateForm__composerButton,
                styles.generateForm__newChatComposerButton,
              )}
            >
              <MessageSquarePlus size={16} />
              新建对话
            </button>
            <label className={styles.generateForm__uploadButton} aria-label="上传参考图">
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
          </div>

          <div className={styles.generateForm__submitArea}>
            <span className={styles.generateForm__costLabel}>预计 {estimate} 积分</span>
            <button
              type="button"
              onClick={() => void onSubmit()}
              disabled={isBusy || !prompt.trim()}
              className={styles.generateForm__submitButton}
              aria-label="生成图片"
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
