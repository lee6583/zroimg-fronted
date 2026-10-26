"use client";

import clsx from "clsx";
import { useState } from "react";
import { Download, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { favoriteCollectionsApi } from "@/api/generation/favorites";
import { Sheet } from "@/components/ui/sheet";
import { PublishGalleryButton } from "@/features/gallery/publish-button";
import { translateApiError } from "@/i18n/api-error";
import { Link } from "@/i18n/navigation";
import type { FavoriteCollection } from "@/types/favorites";
import type { GalleryStatus } from "@/types/gallery";
import styles from "./history-image-actions.module.css";

type HistoryImageActionsProps = {
  generatedImageId: string;
  galleryStatus: GalleryStatus | null;
  galleryReason: string | null;
  collections: FavoriteCollection[];
  downloadUrl: string;
  downloadFileName: string;
  showPublish?: boolean;
  placement?: "default" | "result";
  media?: "image" | "video";
  // touch：手机端放大点击区域（≥ 44px），用于创作历史卡片
  size?: "compact" | "touch";
};

export function HistoryImageActions(props: HistoryImageActionsProps) {
  const generatedImageId = props.generatedImageId;
  const galleryStatus = props.galleryStatus;
  const galleryReason = props.galleryReason;
  const collections = props.collections;
  const downloadUrl = props.downloadUrl;
  const downloadFileName = props.downloadFileName;
  const showPublish = props.showPublish ?? true;
  const placement = props.placement ?? "default";
  const isVideo = props.media === "video";
  const isTouch = props.size === "touch";

  const t = useTranslations("history.actions");
  const tPicker = useTranslations("favorites.picker");
  const tFavorites = useTranslations("favorites");
  const tError = useTranslations("errors.api");
  let downloadLabel = t("downloadImage");
  if (isVideo) {
    downloadLabel = t("downloadVideo");
  }

  const [isOpen, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isFavorited, setFavorited] = useState(false);

  function openPanel() {
    setMessage("");
    setOpen(true);
  }

  async function addToCollection(collectionId: string) {
    if (!collectionId) {
      setMessage(tPicker("noCollection"));
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await favoriteCollectionsApi.addImage(collectionId, { generatedImageId });
    } catch (error) {
      setMessage(translateApiError(error, tError));
      setLoading(false);
      return;
    }

    setMessage("");
    setFavorited(true);
    setOpen(false);
    setLoading(false);
  }

  const iconClassName = clsx(
    styles.historyImageActions__iconButton,
    placement === "result" && styles.historyImageActions__iconButtonResult,
  );
  let favoriteLabel = tPicker("open");
  if (isFavorited) {
    favoriteLabel = tPicker("done");
  }

  return (
    <div
      className={clsx(
        styles.historyImageActions,
        placement === "result" && styles.historyImageActionsResult,
        isTouch && styles.historyImageActionsTouch,
      )}
    >
      <div className={styles.historyImageActions__row}>
        {showPublish && !isVideo ? (
          <PublishGalleryButton
            generatedImageId={generatedImageId}
            initialStatus={galleryStatus}
            initialReason={galleryReason}
            size={props.size}
          />
        ) : null}

        {isVideo ? null : (
          <button
            type="button"
            aria-label={favoriteLabel}
            title={favoriteLabel}
            aria-pressed={isFavorited}
            onClick={openPanel}
            className={clsx(
              iconClassName,
              isFavorited && styles.historyImageActions__iconButtonActive,
            )}
          >
            <Star size={13} fill={isFavorited ? "currentColor" : "none"} />
          </button>
        )}

        <a
          aria-label={downloadLabel}
          title={downloadLabel}
          href={downloadUrl}
          download={downloadFileName}
          className={iconClassName}
        >
          <Download size={13} />
        </a>
      </div>

      <Sheet
        open={isOpen}
        onClose={() => setOpen(false)}
        title={tPicker("title")}
        isLocked={isLoading}
        className={styles.historyImageActions__sheet}
      >
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
                    <span
                      className={styles.historyImageActions__collectionName}
                      title={collection.name}
                    >
                      {collection.name}
                    </span>
                    <span className={styles.historyImageActions__collectionMeta}>
                      {tFavorites("card.count", { count: collection.count.items })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className={styles.historyImageActions__empty}>
            {tPicker("empty")}{" "}
            <Link href="/favorites" className={styles.historyImageActions__emptyLink}>
              {tPicker("manage")}
            </Link>
          </p>
        )}

        {isLoading ? (
          <p className={styles.historyImageActions__dialogText}>{tPicker("saving")}</p>
        ) : null}
        {message && isOpen ? (
          <p className={styles.historyImageActions__dialogError}>{message}</p>
        ) : null}
      </Sheet>

      {message && !isOpen ? <p className={styles.historyImageActions__message}>{message}</p> : null}
    </div>
  );
}
