import { ImageOff } from "lucide-react";
import { getTranslations } from "next-intl/server";
import styles from "./generate-unavailable.module.css";

export async function GenerateUnavailable() {
  const t = await getTranslations("generate.unavailable");
  return (
    <div className={styles.unavailable}>
      <span className={styles.unavailable__icon}>
        <ImageOff size={30} />
      </span>
      <h2 className={styles.unavailable__title}>{t("title")}</h2>
      <p className={styles.unavailable__text}>{t("description")}</p>
    </div>
  );
}
