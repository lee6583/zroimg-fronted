import { ImageOff } from "lucide-react";
import styles from "./generate-unavailable.module.css";

export function GenerateUnavailable() {
  return (
    <div className={styles.unavailable}>
      <span className={styles.unavailable__icon}>
        <ImageOff size={30} />
      </span>
      <h2 className={styles.unavailable__title}>图片生成暂未开放</h2>
      <p className={styles.unavailable__text}>管理员配置图片模型后即可使用。</p>
    </div>
  );
}
