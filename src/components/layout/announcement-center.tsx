"use client";

import { Bell, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PublicAnnouncement } from "@/types/announcement";
import styles from "./product-top-nav.module.css";

type AnnouncementCenterProps = {
  announcement: PublicAnnouncement;
  shouldAutoOpen: boolean;
};

function getDismissKey(announcement: PublicAnnouncement) {
  return `zroimg-announcement-dismissed:${announcement.updatedAt}`;
}

function canShowAnnouncement(announcement: PublicAnnouncement) {
  return Boolean(announcement.enabled && announcement.title.trim() && announcement.content.trim());
}

export function AnnouncementCenter(props: AnnouncementCenterProps) {
  const announcement = props.announcement;
  const shouldAutoOpen = props.shouldAutoOpen;
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    if (!shouldAutoOpen || !canShowAnnouncement(announcement)) {
      return;
    }

    const dismissKey = getDismissKey(announcement);
    const isDismissed = window.sessionStorage.getItem(dismissKey) === "true";
    if (!isDismissed) {
      const timer = window.setTimeout(() => {
        setOpen(true);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [announcement, shouldAutoOpen]);

  function closeAnnouncement() {
    if (canShowAnnouncement(announcement)) {
      window.sessionStorage.setItem(getDismissKey(announcement), "true");
    }

    setOpen(false);
  }

  function openAnnouncement() {
    setOpen(true);
  }

  const hasAnnouncement = canShowAnnouncement(announcement);
  const title = hasAnnouncement ? announcement.title : "暂无公告";
  const content = hasAnnouncement ? announcement.content : "当前没有正在展示的站内公告。";
  const dialog =
    isOpen && typeof document !== "undefined"
      ? createPortal(
          <div className={styles.productTopNav__announcementBackdrop} role="presentation">
            <section
              className={styles.productTopNav__announcementDialog}
              role="dialog"
              aria-modal="true"
              aria-labelledby="announcement-title"
            >
              <div className={styles.productTopNav__announcementHeader}>
                <div>
                  <p className={styles.productTopNav__announcementKicker}>公告</p>
                  <h2 id="announcement-title" className={styles.productTopNav__announcementTitle}>
                    {title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeAnnouncement}
                  className={styles.productTopNav__announcementClose}
                  aria-label="关闭公告"
                >
                  <X size={18} />
                </button>
              </div>
              <p className={styles.productTopNav__announcementContent}>{content}</p>
            </section>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        className="nav-icon-button"
        type="button"
        onClick={openAnnouncement}
        aria-label="查看公告"
      >
        <Bell size={16} />
      </button>
      {dialog}
    </>
  );
}
