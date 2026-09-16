import { Bot, User } from "lucide-react";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { HistoryImageActions } from "@/features/history/history-image-actions";
import { getImageResolutionLabel } from "@/utils/generation-quality";
import { taskStatusLabels, type FavoriteCollectionItem, type TaskItem } from "./generation-model";
import styles from "./generate-form.module.css";

type TaskPreviewProps = {
  tasks: TaskItem[];
  collections: FavoriteCollectionItem[];
  onPromptChange: (value: string) => void;
};

type TaskMessageProps = {
  task: TaskItem;
  collections: FavoriteCollectionItem[];
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
      const imageCount = task.outputs.length;
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
  const hasImages = task.outputs.length > 0;
  const isWaiting = task.status === "queued" || task.status === "running";
  const metaText = `${taskStatusLabels[task.status]} · ${getImageResolutionLabel(task.quality)} · ${task.ratio} · ${task.imageCount} 张 · ${task.costCredits} 积分`;

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
              {task.outputs.map((output, index) => (
                <div key={output.id} className={styles.generateForm__chatImageItem}>
                  <ImageLightbox
                    src={output.fullImageUrl}
                    previewSrc={output.imageUrl}
                    alt={`${task.prompt}，生成结果 ${index + 1}`}
                    width={output.width || 768}
                    height={output.height || 768}
                    fit="intrinsic"
                    triggerClassName={styles.generateForm__chatImageTrigger}
                    imageClassName={styles.generateForm__chatImage}
                  />
                  <HistoryImageActions
                    generatedImageId={output.id}
                    initialPublished={false}
                    collections={collections}
                    downloadUrl={output.downloadUrl}
                    downloadFileName={output.fileName || `zroimg-${task.id}-${index + 1}.png`}
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
