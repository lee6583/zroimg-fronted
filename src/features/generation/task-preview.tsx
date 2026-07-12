import Image from "next/image";
import { promptSuggestions, taskStatusLabels, type TaskItem } from "./generation-model";
import styles from "./generate-form.module.css";

type TaskPreviewProps = {
  tasks: TaskItem[];
  onPromptChange: (value: string) => void;
};

export function TaskPreview(props: TaskPreviewProps) {
  const tasks = props.tasks;
  const onPromptChange = props.onPromptChange;

  return (
    <div className={styles.generateForm__promptArea}>
      <div className={styles.generateForm__promptInner}>
        <h1 className={styles.generateForm__headline}>你好！描述你想要的图片，我来为你生成。</h1>
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

        {tasks.length ? (
          <div className={styles.generateForm__recentTasks}>
            {tasks.slice(0, 3).map((task) => (
              <article key={task.id} className={styles.generateForm__recentTask}>
                <p className={styles.generateForm__recentPrompt}>{task.prompt}</p>
                <p className={styles.generateForm__recentMeta}>
                  {taskStatusLabels[task.status]} · {task.size} · {task.imageCount} 张 ·{" "}
                  {task.costCredits} 积分
                </p>
                {task.imageUrls?.length ? (
                  <div className={styles.generateForm__recentImages}>
                    {task.imageUrls.map((url, index) => (
                      <Image
                        key={`${task.id}-${index}`}
                        className={styles.generateForm__recentImage}
                        src={url}
                        alt={task.prompt}
                        width={128}
                        height={128}
                        unoptimized
                      />
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
