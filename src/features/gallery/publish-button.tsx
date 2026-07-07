"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { publishGalleryImage } from "@/api/generation/gallery";
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
      await publishGalleryImage({ generatedImageId });
    } catch (error) {
      setLabel(error instanceof Error ? error.message : "发布失败");
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
