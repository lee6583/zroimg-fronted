import { Bot, User } from "lucide-react";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { HistoryImageActions } from "@/features/history/history-image-actions";
import type { FavoriteCollection } from "@/types/favorites";
import type { GenerationTask } from "@/types/generation";
import { getImageResolutionLabel } from "@/utils/generation-quality";
import { userAssetDownloadUrl } from "@/utils/media";
import { isTaskPending, taskStatusLabels } from "./generation-model";
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

const promptSuggestions = ["一只在星空下弹吉他的猫", "未来城市的日落景色", "水彩风格的樱花园"];

export function TaskPreview(props: TaskPreviewProps) {
  const tasks = props.tasks;
  const collections = props.collections;
  const onPromptChange = props.onPromptChange;
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
              <h1 className={styles.generateForm__headline}>
                你好！描述你想要的图片，我来为你生成。
              </h1>
              <p className={styles.generateForm__suggestionLabel}>试试这些提示词：</p>
              <div className={styles.generateForm__suggestions}>
                {promptSuggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onPromptChange(item)}
                    className={styles.generateForm__suggestionButton}
                  >
                    {item}
                  </button>
                ))}
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
  const results = task.results ?? [];
  const hasImages = results.length > 0;
  const isWaiting = isTaskPending(task);
  const quality = getImageResolutionLabel(task.quality ?? "");
  const metaText = `${taskStatusLabels[task.status]} · ${quality} · ${task.ratio} · ${task.count} 张 · ${task.requiredPoints} 积分`;
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
                    alt={`${task.prompt}，生成结果 ${index + 1}`}
                    width={768}
                    height={768}
                    fit="intrinsic"
                    triggerClassName={styles.generateForm__chatImageTrigger}
                    imageClassName={styles.generateForm__chatImage}
                  />
                  <HistoryImageActions
                    generatedImageId={result.id}
                    initialPublished={false}
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
              <p className={styles.generateForm__assistantMeta}>{metaText}</p>
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
                    {isWaiting ? "正在生成画面" : "生成失败了，请调整描述后再试。"}
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

function Avatar({ type }: { type: "bot" | "user" }) {
  const className = clsx(
    styles.generateForm__avatar,
    type === "bot" ? styles.generateForm__botAvatar : styles.generateForm__userAvatar,
  );

  return <div className={className}>{type === "bot" ? <Bot size={15} /> : <User size={14} />}</div>;
}
