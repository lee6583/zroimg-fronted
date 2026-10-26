"use client";

import { useEffect, useState } from "react";
import { galleryApi } from "@/api/generation/gallery";
import { HistoryImageActions } from "@/features/history/history-image-actions";
import type { FavoriteCollection } from "@/types/favorites";
import type { GallerySubmission } from "@/types/gallery";
import { userAssetDownloadUrl } from "@/utils/media";

type CanvasResultActionsProps = {
  resultId: string;
  mediaAssetId: string;
  collections: FavoriteCollection[];
};

type Lookup = {
  isDone: boolean;
  submission: GallerySubmission | null;
};

const pageSize = 50;

// 画布节点只保存 resultId，选中时翻页查找该图的投稿记录
async function findSubmission(generatedImageId: string) {
  let pageNo = 1;
  let pages = 1;

  while (pageNo <= pages) {
    const page = await galleryApi.listSubmissions({ pageNo, pageSize });
    const match = page.list.find((item) => item.generatedImageId === generatedImageId);
    if (match) {
      return match;
    }

    pages = page.pages;
    pageNo += 1;
  }

  return null;
}

export function CanvasResultActions(props: CanvasResultActionsProps) {
  const resultId = props.resultId;
  const mediaAssetId = props.mediaAssetId;
  const collections = props.collections;

  const [lookup, setLookup] = useState<Lookup>({ isDone: false, submission: null });

  useEffect(() => {
    let isActive = true;

    async function load() {
      let submission: GallerySubmission | null = null;
      try {
        submission = await findSubmission(resultId);
      } catch {
        // 查询失败时按未投稿展示，重复投稿由 Java 拒绝并提示
        submission = null;
      }

      if (isActive) {
        setLookup({ isDone: true, submission });
      }
    }

    void load();
    return () => {
      isActive = false;
    };
  }, [resultId]);

  const submission = lookup.submission;

  return (
    <HistoryImageActions
      generatedImageId={resultId}
      galleryStatus={submission?.status ?? null}
      galleryReason={submission?.rejectReason ?? null}
      showPublish={lookup.isDone}
      collections={collections}
      downloadUrl={userAssetDownloadUrl(mediaAssetId)}
      downloadFileName={`canvas-${resultId}.png`}
    />
  );
}
