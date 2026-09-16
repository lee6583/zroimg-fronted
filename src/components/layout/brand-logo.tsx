import Image from "next/image";
import Link from "next/link";
import styles from "./brand-logo.module.css";

export function BrandLogo() {
  return (
    <Link href="/" className={styles.brandLogo} aria-label="ZroImg 首页">
      <span className={styles.brandLogo__mark} aria-hidden="true">
        <Image
          src="/assets/day-icon.png"
          alt=""
          width={32}
          height={32}
          unoptimized
          className={`${styles.brandLogo__icon} ${styles.brandLogo__iconLight}`}
        />
        <Image
          src="/assets/night-icon.png"
          alt=""
          width={32}
          height={32}
          unoptimized
          className={`${styles.brandLogo__icon} ${styles.brandLogo__iconDark}`}
        />
      </span>
      <span className={styles.brandLogo__text}>ZroImg</span>
    </Link>
  );
}
