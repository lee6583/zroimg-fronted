import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import styles from "./auth-form.module.css";

/** 后台关闭注册时替代注册表单（服务端渲染，或注册接口返回 403 时由表单切换）。 */
export function RegisterClosed() {
  const t = useTranslations("auth.register.closed");

  return (
    <div className={styles.authForm__closed}>
      <h1 className="page-title">{t("title")}</h1>
      <p className={styles.authForm__closedText}>{t("text")}</p>
      <Link href="/login" className={styles.authForm__submit}>
        {t("action")}
      </Link>
    </div>
  );
}
