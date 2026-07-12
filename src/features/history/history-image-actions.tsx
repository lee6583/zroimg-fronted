"use client";

import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { Download, Heart } from "lucide-react";
import { favoriteCollectionsApi } from "@/api/generation/favorites";
import { AppSelect } from "@/components/ui/app-select";
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
  const [collectionId, setCollectionId] = useState(collections[0]?.id || "");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);

  async function addToCollection() {
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

    setMessage("已收藏");
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
          title="收藏到合集"
          onClick={() => setOpen((current) => !current)}
          className={styles.historyImageActions__iconButton}
        >
          <Heart size={15} />
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
          <Download size={15} />
        </a>
      </div>

      {isOpen ? (
        <div className={styles.historyImageActions__panel}>
          {collections.length > 0 ? (
            <>
              <AppSelect
                value={collectionId}
                onChange={setCollectionId}
                options={collections.map((collection) => ({
                  value: collection.id,
                  label: `${collection.name} · ${collection.imageCount} 张`,
                }))}
                triggerClassName={styles.historyImageActions__selectTrigger}
              />
              <button
                type="button"
                disabled={isLoading}
                onClick={addToCollection}
                className={styles.historyImageActions__saveButton}
              >
                {isLoading ? "收藏中" : "收藏"}
              </button>
            </>
          ) : (
            <p className={styles.historyImageActions__message}>请先到收藏合集里新建合集</p>
          )}
        </div>
      ) : null}

      {message ? <p className={styles.historyImageActions__message}>{message}</p> : null}
    </div>
  );
}
