"use client";

import { useState } from "react";
import { Send } from "lucide-react";
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

    const response = await fetch("/api/gallery/publish", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ generatedImageId }),
    });
    const data = await response.json();

    if (!response.ok) {
      setLabel(data.error || "发布失败");
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
