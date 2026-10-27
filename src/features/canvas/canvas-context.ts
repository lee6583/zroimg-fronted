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
  // 在画布底部显示一条短提示（与生成提示共用）
  notify: (text: string) => void;
  generate: (nodeId: string) => Promise<void>;
  generateFrom: (imageId: string) => void;
  inpaint: (imageId: string) => void;
  // 重新编辑生成节点的局部重绘蒙版
  editMask: (generatorId: string) => void;
  // 在生成节点的提示词框里粘贴图片：作为图片节点放到它左侧并连线
  pasteImages: (generatorId: string, files: File[]) => void;
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
