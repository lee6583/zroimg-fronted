import type { Edge, Node, XYPosition } from "@xyflow/react";
import type {
  CanvasGeneratorData,
  CanvasImageData,
  CanvasNoteData,
  CanvasScene,
  CanvasSceneEdge,
  CanvasSceneNode,
  CanvasViewport,
} from "@/types/canvas";
import type {
  CreateGenerationTaskRequest,
  GenerationMode,
  GenerationModel,
} from "@/types/generation";

type ImageNode = Node<CanvasImageData, "image">;
type GeneratorNode = Node<CanvasGeneratorData, "generator">;
type NoteNode = Node<CanvasNoteData, "note">;
type CanvasNode = ImageNode | GeneratorNode | NoteNode;

type CanvasFlow = {
  nodes: CanvasNode[];
  edges: Edge[];
  viewport: CanvasViewport;
};

type GeneratorOptions = {
  modelCode: string;
  ratio: string;
  quality: string;
  count: number;
};

type ResultImage = {
  mediaAssetId: string;
  resultId: string | null;
  url: string | null;
  width: number | null;
  height: number | null;
};

type Connection = {
  source: string;
  target: string;
};

export const imageNodeWidth = 280;
export const generatorNodeWidth = 320;
export const noteNodeWidth = 220;
export const resultGap = 24;
export const defaultViewport: CanvasViewport = { x: 0, y: 0, zoom: 1 };

const resultColumns = 2;

function newId() {
  return crypto.randomUUID();
}

export function createImageNode(position: XYPosition, data: Partial<CanvasImageData>): ImageNode {
  return {
    id: newId(),
    type: "image",
    position,
    data: {
      mediaAssetId: data.mediaAssetId ?? null,
      url: data.url ?? null,
      resultId: data.resultId ?? null,
      width: data.width ?? null,
      height: data.height ?? null,
      name: data.name ?? null,
      isUploading: data.isUploading,
    },
  };
}

export function createGeneratorNode(
  position: XYPosition,
  options: GeneratorOptions,
  data?: Partial<CanvasGeneratorData>,
): GeneratorNode {
  return {
    id: newId(),
    type: "generator",
    position,
    data: {
      prompt: "",
      modelCode: options.modelCode,
      ratio: options.ratio,
      quality: options.quality,
      count: options.count,
      referenceMediaId: null,
      maskMediaId: null,
      taskNo: null,
      status: null,
      failReason: null,
      resultsApplied: false,
      ...data,
    },
  };
}

export function createNoteNode(position: XYPosition): NoteNode {
  return {
    id: newId(),
    type: "note",
    position,
    data: { text: "" },
  };
}

export function createEdge(source: string, target: string): Edge {
  return { id: `${source}->${target}`, source, target };
}

export function getNodeWidth(node: CanvasNode) {
  if (node.measured?.width) {
    return node.measured.width;
  }
  if (node.type === "generator") {
    return generatorNodeWidth;
  }
  if (node.type === "note") {
    return noteNodeWidth;
  }

  return imageNodeWidth;
}

export function getUpstreamImage(nodeId: string, nodes: CanvasNode[], edges: Edge[]) {
  for (const edge of edges) {
    if (edge.target !== nodeId) continue;

    const source = nodes.find((node) => node.id === edge.source);
    if (source?.type === "image") {
      return source;
    }
  }

  return null;
}

export function isValidConnection(connection: Connection, nodes: CanvasNode[], edges: Edge[]) {
  if (connection.source === connection.target) {
    return false;
  }

  const source = nodes.find((node) => node.id === connection.source);
  const target = nodes.find((node) => node.id === connection.target);
  if (source?.type !== "image" || target?.type !== "generator") {
    return false;
  }

  const upstream = getUpstreamImage(target.id, nodes, edges);
  return upstream === null;
}

export function getMode(data: CanvasGeneratorData, upstream: ImageNode | null): GenerationMode {
  if (data.maskMediaId) {
    return "inpaint";
  }
  if (upstream?.data.mediaAssetId) {
    return "image_to_image";
  }

  return "text_to_image";
}

export function getReferenceId(data: CanvasGeneratorData, upstream: ImageNode | null) {
  if (data.referenceMediaId) {
    return data.referenceMediaId;
  }

  return upstream?.data.mediaAssetId ?? null;
}

export function getModeModels(models: GenerationModel[], mode: GenerationMode) {
  return models.filter((model) => model.supportModes.includes(mode));
}

function pick<Value>(value: Value, values: Value[], fallback: Value | null) {
  if (values.includes(value)) {
    return value;
  }
  if (fallback !== null && values.includes(fallback)) {
    return fallback;
  }

  return values[0] ?? value;
}

export function resolveOptions(
  options: GeneratorOptions,
  models: GenerationModel[],
  mode: GenerationMode,
): GeneratorOptions | null {
  const available = getModeModels(models, mode);
  let model = available.find((item) => item.modelCode === options.modelCode);
  if (!model) {
    model = available[0];
  }
  if (!model) {
    return null;
  }

  const params = model.supportParams;
  const defaults = params.defaults;

  return {
    modelCode: model.modelCode,
    ratio: pick(options.ratio, params.ratios, defaults.ratio),
    quality: pick(options.quality, params.qualities, defaults.quality),
    count: pick(options.count, params.counts, defaults.count),
  };
}

export function buildTaskRequest(
  canvasId: string,
  data: CanvasGeneratorData,
  upstream: ImageNode | null,
): CreateGenerationTaskRequest {
  const mode = getMode(data, upstream);
  const referenceId = getReferenceId(data, upstream);
  const request: CreateGenerationTaskRequest = {
    canvasId,
    modelCode: data.modelCode,
    prompt: data.prompt.trim(),
    mode,
    ratio: data.ratio,
    quality: data.quality,
    count: data.count,
  };

  if (mode !== "text_to_image" && referenceId) {
    request.referenceMediaId = referenceId;
  }
  if (mode === "inpaint" && data.maskMediaId) {
    request.maskMediaId = data.maskMediaId;
  }

  return request;
}

export function ratioSize(ratio: string) {
  const parts = ratio.split(":");
  const width = Number(parts[0]);
  const height = Number(parts[1]);
  const isValid = parts.length === 2 && width > 0 && height > 0;
  if (!isValid) {
    return null;
  }

  return { width, height };
}

export function getImageHeight(width: number | null, height: number | null) {
  if (!width || !height) {
    return imageNodeWidth;
  }

  return Math.round((imageNodeWidth * height) / width);
}

export function placeResults(
  source: CanvasNode,
  results: ResultImage[],
  ratio: string | null = null,
) {
  const ratioDims = ratioSize(ratio ?? "");
  const startX = source.position.x + getNodeWidth(source) + resultGap * 3;
  const nodes: ImageNode[] = [];
  let rowY = source.position.y;
  let rowHeight = 0;

  results.forEach((result, index) => {
    const column = index % resultColumns;
    if (column === 0 && index > 0) {
      rowY += rowHeight + resultGap;
      rowHeight = 0;
    }

    let height = getImageHeight(result.width, result.height);
    const hasSize = Boolean(result.width && result.height);
    if (!hasSize && ratioDims) {
      height = getImageHeight(ratioDims.width, ratioDims.height);
    }
    rowHeight = Math.max(rowHeight, height);

    const position = {
      x: startX + column * (imageNodeWidth + resultGap),
      y: rowY,
    };
    nodes.push(createImageNode(position, result));
  });

  return nodes;
}

export function pickCover(nodes: CanvasNode[]) {
  for (const node of nodes) {
    if (node.type === "image" && node.data.mediaAssetId) {
      return node.data.mediaAssetId;
    }
  }

  return null;
}

export function isTaskWaiting(data: CanvasGeneratorData) {
  const isActive = data.status === "pending" || data.status === "processing";
  return Boolean(data.taskNo) && isActive && !data.resultsApplied;
}

export function isGeneratorPending(node: CanvasNode) {
  if (node.type !== "generator") {
    return false;
  }

  return isTaskWaiting(node.data);
}

export function countPending(nodes: CanvasNode[]) {
  return nodes.filter(isGeneratorPending).length;
}

export function getPendingTasks(nodes: CanvasNode[]) {
  const tasks: Array<{ nodeId: string; taskNo: string }> = [];
  for (const node of nodes) {
    if (node.type !== "generator" || !isTaskWaiting(node.data)) continue;

    tasks.push({ nodeId: node.id, taskNo: node.data.taskNo ?? "" });
  }

  return tasks;
}

function toSceneNode(node: CanvasNode): CanvasSceneNode | null {
  const position = { x: node.position.x, y: node.position.y };

  if (node.type === "image") {
    // 第一步：上传未完成的占位节点没有媒体 id，不进入场景。
    if (!node.data.mediaAssetId) {
      return null;
    }

    const data: CanvasImageData = {
      mediaAssetId: node.data.mediaAssetId,
      url: node.data.url,
      resultId: node.data.resultId,
      width: node.data.width,
      height: node.data.height,
      name: node.data.name,
    };
    return { id: node.id, type: "image", position, data };
  }

  if (node.type === "generator") {
    return { id: node.id, type: "generator", position, data: { ...node.data } };
  }

  return { id: node.id, type: "note", position, data: { text: node.data.text } };
}

export function sceneFromFlow(
  nodes: CanvasNode[],
  edges: Edge[],
  viewport: CanvasViewport,
): CanvasScene {
  // 第一步：只保留可持久化的节点字段。
  const sceneNodes: CanvasSceneNode[] = [];
  for (const node of nodes) {
    const sceneNode = toSceneNode(node);
    if (sceneNode) sceneNodes.push(sceneNode);
  }

  // 第二步：丢弃指向已移除节点的连线。
  const ids = new Set(sceneNodes.map((node) => node.id));
  const sceneEdges: CanvasSceneEdge[] = [];
  for (const edge of edges) {
    const isConnected = ids.has(edge.source) && ids.has(edge.target);
    if (!isConnected) continue;

    sceneEdges.push({ id: edge.id, source: edge.source, target: edge.target });
  }

  return {
    nodes: sceneNodes,
    edges: sceneEdges,
    viewport: { x: viewport.x, y: viewport.y, zoom: viewport.zoom },
  };
}

export function flowFromScene(scene: Partial<CanvasScene> | null): CanvasFlow {
  const sceneNodes = scene?.nodes ?? [];
  const sceneEdges = scene?.edges ?? [];
  const viewport = scene?.viewport ?? defaultViewport;

  const nodes: CanvasNode[] = sceneNodes.map((node) => {
    const position = { x: node.position.x, y: node.position.y };
    if (node.type === "image") {
      return { id: node.id, type: "image", position, data: { ...node.data } };
    }
    if (node.type === "generator") {
      return { id: node.id, type: "generator", position, data: { ...node.data } };
    }

    return { id: node.id, type: "note", position, data: { ...node.data } };
  });
  const edges: Edge[] = sceneEdges.map((edge) => {
    return { id: edge.id, source: edge.source, target: edge.target };
  });

  return { nodes, edges, viewport };
}

export type {
  ImageNode,
  GeneratorNode,
  NoteNode,
  CanvasNode,
  CanvasFlow,
  GeneratorOptions,
  ResultImage,
};
