"use client";

import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { Send } from "lucide-react";
import { galleryApi } from "@/api/generation/gallery";
import styles from "./publish-button.module.css";

export function PublishGalleryButton({
  generatedImageId,
  initialPublished,
}: {
  generatedImageId: string;
  initialPublished: boolean;
}) {
  const [published, setPublished] = useState(initialPublished);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState(initialPublished ? "已发布" : "发布");

  async function publishImage() {
    setLoading(true);
    setLabel("发布中");

    try {
      await galleryApi.publishImage({ generatedImageId });
    } catch (error) {
      setLabel(getErrorMessage(error));
      setLoading(false);
      return;
    }

    setPublished(true);
    setLabel("已发布");
    setLoading(false);
  }

  return (
    <div className={styles.publishButton}>
      <button
        type="button"
        onClick={publishImage}
        disabled={loading || published}
        className={styles.publishButton__action}
      >
        <Send size={14} />
        {label}
      </button>
    </div>
  );
}
