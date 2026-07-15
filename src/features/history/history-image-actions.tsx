"use client";

import clsx from "clsx";
import { getErrorMessage } from "@/utils/error";
import { useEffect, useState } from "react";
import { Download, Star, X } from "lucide-react";
import { favoriteCollectionsApi } from "@/api/generation/favorites";
import { PublishGalleryButton } from "@/features/gallery/publish-button";
import styles from "./history-image-actions.module.css";

type FavoriteCollection = {
  id: string;
  name: string;
  imageCount: number;
};

type HistoryImageActionsProps = {
  generatedImageId: string;
  initialPublished: boolean;
  collections: FavoriteCollection[];
  downloadUrl: string;
  downloadFileName: string;
};

export function HistoryImageActions(props: HistoryImageActionsProps) {
  const generatedImageId = props.generatedImageId;
  const initialPublished = props.initialPublished;
  const collections = props.collections;
  const downloadUrl = props.downloadUrl;
  const downloadFileName = props.downloadFileName;

  const [isOpen, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isFavorited, setFavorited] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", closeByEscape);
    return () => document.removeEventListener("keydown", closeByEscape);
  }, [isOpen]);

  function openPanel() {
    setMessage("");
    setOpen(true);
  }

  async function addToCollection(collectionId: string) {
    if (!collectionId) {
      setMessage("请先创建合集");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await favoriteCollectionsApi.addImage(collectionId, { generatedImageId });
    } catch (error) {
      setMessage(getErrorMessage(error));
      setLoading(false);
      return;
    }

    setMessage("");
    setFavorited(true);
    setOpen(false);
    setLoading(false);
  }

  return (
    <div className={styles.historyImageActions}>
      <div className={styles.historyImageActions__row}>
        <PublishGalleryButton
          generatedImageId={generatedImageId}
          initialPublished={initialPublished}
        />

        <button
          type="button"
          aria-label="收藏到合集"
          title={isFavorited ? "已收藏" : "收藏到合集"}
          onClick={openPanel}
          className={clsx(
            styles.historyImageActions__iconButton,
            isFavorited && styles.historyImageActions__iconButtonActive,
          )}
        >
          <Star size={13} fill={isFavorited ? "currentColor" : "none"} />
        </button>

        <a
          aria-label="下载图片"
          title="下载图片"
          href={downloadUrl}
          download={downloadFileName}
          target="_blank"
          rel="noreferrer"
          className={styles.historyImageActions__iconButton}
        >
          <Download size={13} />
        </a>
      </div>

      {isOpen ? (
        <div
          className={styles.historyImageActions__overlay}
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="选择收藏合集"
            className={styles.historyImageActions__dialog}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.historyImageActions__dialogHeader}>
              <div>
                <h3 className={styles.historyImageActions__dialogTitle}>收藏到合集</h3>
              </div>
              <button
                type="button"
                aria-label="关闭收藏弹窗"
                onClick={() => setOpen(false)}
                className={styles.historyImageActions__closeButton}
              >
                <X size={15} />
              </button>
            </div>

            {collections.length > 0 ? (
              <div className={styles.historyImageActions__collectionList}>
                {collections.map((collection) => {
                  return (
                    <button
                      key={collection.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => addToCollection(collection.id)}
                      className={styles.historyImageActions__collectionButton}
                    >
                      <span className={styles.historyImageActions__collectionIcon}>
                        <Star size={15} />
                      </span>
                      <span className={styles.historyImageActions__collectionText}>
                        <span className={styles.historyImageActions__collectionName}>
                          {collection.name}
                        </span>
                        <span className={styles.historyImageActions__collectionMeta}>
                          {collection.imageCount} 张图片
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={styles.historyImageActions__empty}>请先到收藏合集里新建合集</p>
            )}

            {isLoading ? (
              <p className={styles.historyImageActions__dialogText}>正在收藏...</p>
            ) : null}
          </section>
        </div>
      ) : null}

      {message ? <p className={styles.historyImageActions__message}>{message}</p> : null}
    </div>
  );
}
