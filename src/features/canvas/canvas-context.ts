"use client";

import { createContext, useContext } from "react";
import type { FavoriteCollection } from "@/types/favorites";
import type { GenerationModel } from "@/types/generation";

type CanvasActions = {
  canvasId: string;
  models: GenerationModel[];
  collections: FavoriteCollection[];
  balance: number;
  setBalance: (balance: number) => void;
  generate: (nodeId: string) => Promise<void>;
  generateFrom: (imageId: string) => void;
  inpaint: (imageId: string) => void;
  remove: (nodeId: string) => void;
  // 手机端在 Sheet 中打开生成节点的提示词和参数
  openGenerator: (nodeId: string) => void;
};

export const CanvasContext = createContext<CanvasActions | null>(null);

export function useCanvasActions() {
  const actions = useContext(CanvasContext);
  if (!actions) {
    throw new Error("CanvasContext is not provided");
  }

  return actions;
}

export type { CanvasActions };
