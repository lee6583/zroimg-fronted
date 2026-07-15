import Image from "next/image";
import { Bot, User } from "lucide-react";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { taskStatusLabels, type TaskItem } from "./generation-model";
import styles from "./generate-form.module.css";

type TaskPreviewProps = {
  tasks: TaskItem[];
  onPromptChange: (value: string) => void;
};

const promptSuggestions = ["一只在星空下弹吉他的猫", "未来城市的日落景色", "水彩风格的樱花园"];

export function TaskPreview(props: TaskPreviewProps) {
  const tasks = props.tasks;
  const onPromptChange = props.onPromptChange;
  const chatTasks = [...tasks].reverse();
  const chatRef = useRef<HTMLDivElement>(null);
  const scrollKey = tasks
    .map((task) => {
      const imageCount = task.imageUrls?.length ?? 0;
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
              <TaskMessage key={task.id} task={task} />
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

function TaskMessage({ task }: { task: TaskItem }) {
  const imageUrls = task.imageUrls ?? [];
  const hasImages = imageUrls.length > 0;
  const isWaiting = task.status === "queued" || task.status === "running";
  const metaText = `${taskStatusLabels[task.status]} · ${task.size} · ${task.imageCount} 张 · ${task.costCredits} 积分`;
  const assistantText =
    task.status === "failed" ? "生成失败了，请调整描述后再试。" : "图片已生成，可到创作历史查看。";

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
        <div className={styles.generateForm__assistantBubble}>
          <p className={styles.generateForm__assistantMeta}>{metaText}</p>

          {hasImages ? (
            <div className={styles.generateForm__chatImages}>
              {imageUrls.map((url, index) => (
                <Image
                  key={`${task.id}-${index}`}
                  className={styles.generateForm__chatImage}
                  src={url}
                  alt={task.prompt}
                  width={240}
                  height={240}
                  unoptimized
                />
              ))}
            </div>
          ) : (
            <div className={styles.generateForm__streamingRow}>
              {isWaiting ? (
                <>
                  <span className={styles.generateForm__streamingDot} />
                  <span className={styles.generateForm__streamingDot} />
                  <span className={styles.generateForm__streamingDot} />
                </>
              ) : null}
              <p className={styles.generateForm__assistantText}>
                {isWaiting ? "正在生成画面" : assistantText}
              </p>
            </div>
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
