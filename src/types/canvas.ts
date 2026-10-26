import type { GenerationTaskRetry, GenerationTaskStatus } from "@/types/generation";

type CanvasBoard = {
  id: string;
  title: string;
  coverMediaId: string | null;
  coverUrl: string | null;
  nodeCount: number;
  version: number;
  createTime: string;
  updateTime: string;
};

type CanvasNodeKind = "image" | "generator" | "note";

type CanvasPosition = {
  x: number;
  y: number;
};

type CanvasViewport = {
  x: number;
  y: number;
  zoom: number;
};

type CanvasImageData = {
  mediaAssetId: string | null;
  url: string | null;
  resultId: string | null;
  width: number | null;
  height: number | null;
  name: string | null;
  // 仅运行时：上传中的占位节点不会保存
  isUploading?: boolean;
};

type CanvasGeneratorData = {
  prompt: string;
  modelCode: string;
  ratio: string;
  quality: string;
  count: number;
  referenceMediaId: string | null;
  maskMediaId: string | null;
  taskNo: string | null;
  status: GenerationTaskStatus | null;
  failReason: string | null;
  resultsApplied: boolean;
  // 仅运行时：轮询到的自动重试进度，不会保存
  retry?: GenerationTaskRetry;
};

type CanvasNoteData = {
  text: string;
};

type CanvasSceneNode =
  | { id: string; type: "image"; position: CanvasPosition; data: CanvasImageData }
  | { id: string; type: "generator"; position: CanvasPosition; data: CanvasGeneratorData }
  | { id: string; type: "note"; position: CanvasPosition; data: CanvasNoteData };

type CanvasSceneEdge = {
  id: string;
  source: string;
  target: string;
};

type CanvasScene = {
  nodes: CanvasSceneNode[];
  edges: CanvasSceneEdge[];
  viewport: CanvasViewport;
};

type CanvasBoardDetail = CanvasBoard & {
  scene: Partial<CanvasScene> | null;
};

type CreateCanvasBoardRequest = {
  title?: string;
};

type RenameCanvasBoardRequest = {
  title: string;
};

type SaveCanvasSceneRequest = {
  scene: CanvasScene;
  version: number;
  coverMediaId?: string;
  nodeCount: number;
};

type SaveCanvasSceneResponse = {
  version: number;
  updateTime: string;
};

type CanvasConfig = {
  enabled: boolean;
  maxBoardsPerUser: number;
  maxNodesPerBoard: number;
  maxSceneKb: number;
  maxPendingTasksPerBoard: number;
  allowedModelCodes: string[];
};

export type {
  CanvasBoard,
  CanvasNodeKind,
  CanvasPosition,
  CanvasViewport,
  CanvasImageData,
  CanvasGeneratorData,
  CanvasNoteData,
  CanvasSceneNode,
  CanvasSceneEdge,
  CanvasScene,
  CanvasBoardDetail,
  CreateCanvasBoardRequest,
  RenameCanvasBoardRequest,
  SaveCanvasSceneRequest,
  SaveCanvasSceneResponse,
  CanvasConfig,
};
