import styles from "./loading.module.css";

export default function AdminLoading() {
  return (
    <div className={styles.adminLoading} aria-label="正在加载后台页面" aria-busy="true">
      <div className={styles.adminLoading__title} />
      <div className={styles.adminLoading__toolbar} />
      <div className={styles.adminLoading__content}>
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className={styles.adminLoading__row} />
        ))}
      </div>
    </div>
  );
}
