"use client";

import clsx from "clsx";
import { Film, PanelLeftClose } from "lucide-react";
import { useState } from "react";
import { VideoSettings } from "./video-settings";
import styles from "./video.module.css";

export function VideoWorkspace() {
  const [isSettingsOpen, setSettingsOpen] = useState(true);

  return (
    <main className={clsx(styles.videoPage, !isSettingsOpen && styles.videoPageCollapsed)}>
      {isSettingsOpen ? <VideoSettings /> : null}

      <section className={styles.videoPage__workspace}>
        <div className={styles.videoPage__toolbar}>
          <button
            type="button"
            onClick={() => setSettingsOpen((isOpen) => !isOpen)}
            className={styles.videoPage__collapseButton}
            aria-label={isSettingsOpen ? "收起视频设置" : "展开视频设置"}
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <section className={styles.videoPage__empty}>
          <span className={styles.videoPage__emptyIcon}>
            <Film size={30} />
          </span>
          <h2 className={styles.videoPage__emptyTitle}>还没有视频作品</h2>
        </section>
      </section>
    </main>
  );
}
