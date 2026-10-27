"use client";

import { createContext, useContext } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import type { MediaPreview } from "@/types/generation";

// 画布图片的预览信息（尺寸、模糊占位图）和优先加载节点只放内存，不进入场景 JSON，不会触发保存
type PreviewState = {
  previews: Record<string, MediaPreview>;
  priorityIds: string[];
  addPreviews: (items: MediaPreview[]) => void;
  setPriority: (ids: string[]) => void;
};

type PreviewStore = StoreApi<PreviewState>;

export function createPreviewStore(priorityIds: string[], initialPreviews: MediaPreview[]) {
  const previews: Record<string, MediaPreview> = {};
  for (const item of initialPreviews) {
    previews[item.id] = item;
  }

  return createStore<PreviewState>((set) => {
    return {
      previews,
      priorityIds,
      addPreviews(items) {
        if (items.length === 0) return;

        set((state) => {
          const next = { ...state.previews };
          for (const item of items) {
            next[item.id] = item;
          }

          return { previews: next };
        });
      },
      setPriority(ids) {
        set({ priorityIds: ids });
      },
    };
  });
}

export const PreviewStoreContext = createContext<PreviewStore | null>(null);

function usePreviewStoreApi() {
  const store = useContext(PreviewStoreContext);
  if (!store) {
    throw new Error("PreviewStoreContext is not provided");
  }

  return store;
}

export function useMediaPreview(mediaAssetId: string | null) {
  const store = usePreviewStoreApi();
  return useStore(store, (state) => {
    if (!mediaAssetId) return null;

    return state.previews[mediaAssetId] ?? null;
  });
}

export function useIsPriority(nodeId: string) {
  const store = usePreviewStoreApi();
  return useStore(store, (state) => state.priorityIds.includes(nodeId));
}

export type { PreviewStore };
