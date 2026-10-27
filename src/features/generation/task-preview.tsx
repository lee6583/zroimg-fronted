import { Bot, User } from "lucide-react";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { HistoryImageActions } from "@/features/history/history-image-actions";
import type { FavoriteCollection } from "@/types/favorites";
import type { GenerationTask } from "@/types/generation";
import { getImageResolutionLabel } from "@/utils/generation-quality";
import { userAssetDownloadUrl, userAssetPreviewUrl } from "@/utils/media";
import { getTaskStatusLabel, isTaskRetrying } from "@/utils/task-status";
import { isTaskPending } from "./generation-model";
import { useClock } from "./use-clock";
import styles from "./generate-form.module.css";

type TaskPreviewProps = {
  tasks: GenerationTask[];
  collections: FavoriteCollection[];
  onPromptChange: (value: string) => void;
};

type TaskMessageProps = {
  task: GenerationTask;
  collections: FavoriteCollection[];
};

type TaskMetaProps = {
  task: GenerationTask;
  detail: string;
};

const promptSuggestions = ["cat", "city", "sakura"] as const;

export function TaskPreview(props: TaskPreviewProps) {
  const tasks = props.tasks;
  const collections = props.collections;
  const onPromptChange = props.onPromptChange;
  const t = useTranslations("generate.preview");
  const chatTasks = [...tasks].reverse();
  const chatRef = useRef<HTMLDivElement>(null);
  const scrollKey = tasks
    .map((task) => {
      const imageCount = task.results?.length ?? 0;
      return `${task.id}:${task.status}:${imageCount}`;
    })
    .join("|");

  useEffect(() => {
    const chat = chatRef.current;
    if (!chat) return;

    chat.scrollTop = chat.scrollHeight;
  }, [scrollKey]);

  return (
    <div ref={chatRef} className={styles.generateForm__chatArea}>
      <div className={styles.generateForm__chatInner}>
        {chatTasks.length ? (
          <div className={styles.generateForm__messageList}>
            {chatTasks.map((task) => (
              <TaskMessage key={task.id} task={task} collections={collections} />
            ))}
          </div>
        ) : (
          <div className={styles.generateForm__emptyChat}>
            <div className={styles.generateForm__emptyInner}>
              <h1 className={styles.generateForm__headline}>{t("greeting")}</h1>
              <p className={styles.generateForm__suggestionLabel}>{t("suggestionLabel")}</p>
              <div className={styles.generateForm__suggestions}>
                {promptSuggestions.map((key) => {
                  const text = t(`suggestions.${key}`);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onPromptChange(text)}
                      className={styles.generateForm__suggestionButton}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskMessage(props: TaskMessageProps) {
  const task = props.task;
  const collections = props.collections;
  const t = useTranslations("generate.preview");
  const tTask = useTranslations("task");
  const results = task.results ?? [];
  const hasImages = results.length > 0;
  const isWaiting = isTaskPending(task);
  const isRetrying = isTaskRetrying(task);
  const quality = getImageResolutionLabel(task.quality ?? "", tTask);
  const detail = t("detail", {
    quality,
    ratio: task.ratio ?? "",
    count: task.count,
    points: task.requiredPoints,
  });
  let waitText = t("waiting");
  if (isRetrying) {
    waitText = t("retrying");
  }
  const extension = task.format || "png";

  return (
    <div className={styles.generateForm__taskMessages}>
      <div className={clsx(styles.generateForm__chatMessage, styles.generateForm__chatMessageUser)}>
        <Avatar type="user" />
        <div className={styles.generateForm__userBubble}>
          <p>{task.prompt}</p>
        </div>
      </div>

      <div
        className={clsx(
          styles.generateForm__chatMessage,
          styles.generateForm__chatMessageAssistant,
        )}
      >
        <Avatar type="bot" />
        <div
          className={clsx(
            styles.generateForm__assistantBubble,
            hasImages && styles.generateForm__assistantBubbleResult,
          )}
        >
          {hasImages ? (
            <div className={styles.generateForm__chatImages}>
              {results.map((result, index) => (
                <div key={result.id} className={styles.generateForm__chatImageItem}>
                  <ImageLightbox
                    src={result.resultUrl}
                    previewSrc={userAssetPreviewUrl(result.mediaAssetId)}
                    alt={t("resultAlt", { prompt: task.prompt, index: index + 1 })}
                    width={768}
                    height={768}
                    fit="intrinsic"
                    triggerClassName={styles.generateForm__chatImageTrigger}
                    imageClassName={styles.generateForm__chatImage}
                  />
                  <HistoryImageActions
                    generatedImageId={result.id}
                    galleryStatus={result.galleryStatus}
                    galleryReason={result.galleryRejectReason}
                    collections={collections}
                    downloadUrl={userAssetDownloadUrl(result.mediaAssetId)}
                    downloadFileName={`zroimg-${task.taskNo}-${index + 1}.${extension}`}
                    showPublish={false}
                    placement="result"
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              {isRetrying ? (
                <RetryMeta task={task} detail={detail} />
              ) : (
                <p className={styles.generateForm__assistantMeta}>
                  {t("meta", { status: getTaskStatusLabel(task, tTask), detail })}
                </p>
              )}
              {isWaiting || task.status === "failed" ? (
                <div className={styles.generateForm__streamingRow}>
                  {isWaiting ? (
                    <>
                      <span className={styles.generateForm__streamingDot} />
                      <span className={styles.generateForm__streamingDot} />
                      <span className={styles.generateForm__streamingDot} />
                    </>
                  ) : null}
                  <p className={styles.generateForm__assistantText}>
                    {isWaiting ? waitText : t("failed")}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 重试等待期间每秒刷新倒计时
function RetryMeta(props: TaskMetaProps) {
  const t = useTranslations("generate.preview");
  const tTask = useTranslations("task");
  const now = useClock();
  const label = getTaskStatusLabel(props.task, tTask, now || undefined);

  return (
    <p className={styles.generateForm__assistantMeta}>
      {t("meta", { status: label, detail: props.detail })}
    </p>
  );
}

function Avatar({ type }: { type: "bot" | "user" }) {
  const className = clsx(
    styles.generateForm__avatar,
    type === "bot" ? styles.generateForm__botAvatar : styles.generateForm__userAvatar,
  );

  return <div className={className}>{type === "bot" ? <Bot size={15} /> : <User size={14} />}</div>;
}
