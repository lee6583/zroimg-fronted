"use client";

import "@xyflow/react/dist/style.css";
import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type XYPosition,
} from "@xyflow/react";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { canvasBoardsApi } from "@/api/canvas/boards";
import { generationTasksApi } from "@/api/generation/tasks";
import { uploadMediaFile } from "@/api/media/uploads";
import { modeLabels } from "@/features/generation/generation-model";
import type { CanvasBoardDetail, CanvasConfig, SaveCanvasSceneRequest } from "@/types/canvas";
import type { FavoriteCollection } from "@/types/favorites";
import type { GenerationModel, GenerationTask, MediaAsset } from "@/types/generation";
import { getErrorMessage } from "@/utils/error";
import { ApiRequestError } from "@/utils/request";
import { isSupportedImageType, maxImageBytes } from "@/utils/media";
import { CanvasContext, type CanvasActions } from "./canvas-context";
import { CanvasHistoryPicker, type PickedImage } from "./canvas-history-picker";
import { CanvasResultActions } from "./canvas-result-actions";
import {
  buildTaskRequest,
  countPending,
  createEdge,
  createGeneratorNode,
  createImageNode,
  createNoteNode,
  flowFromScene,
  generatorNodeWidth,
  getMode,
  getNodeWidth,
  getPendingTasks,
  getUpstreamImage,
  imageNodeWidth,
  isSameRetry,
  isTaskWaiting,
  isValidConnection,
  noteNodeWidth,
  pickCover,
  placeResults,
  readRetry,
  resolveOptions,
  resultGap,
  sceneFromFlow,
  type CanvasNode,
  type GeneratorOptions,
  type ImageNode,
} from "./canvas-model";
import {
  CanvasStoreContext,
  createCanvasStore,
  useCanvasStore,
  useCanvasStoreApi,
  type CanvasStore,
} from "./canvas-store";
import { CanvasToolbar, type SaveStatus } from "./canvas-toolbar";
import { MaskEditorDialog } from "./mask-editor-dialog";
import { CanvasGeneratorNode } from "./nodes/generator-node";
import { CanvasImageNode, getImageSrc } from "./nodes/image-node";
import { CanvasNoteNode } from "./nodes/note-node";
import styles from "./canvas-editor.module.css";

type CanvasEditorProps = {
  board: CanvasBoardDetail;
  config: CanvasConfig;
  models: GenerationModel[];
  collections: FavoriteCollection[];
  balance: number;
  defaults: GeneratorOptions | null;
};

type SaveState = "idle" | "saving" | "error" | "conflict";

const nodeTypes = {
  image: CanvasImageNode,
  generator: CanvasGeneratorNode,
  note: CanvasNoteNode,
};

const pollDelay = 2500;
const saveDelay = 1500;
const nodeGap = 80;

export function CanvasEditor(props: CanvasEditorProps) {
  const board = props.board;
  const [store] = useState(() => createCanvasStore(flowFromScene(board.scene), board.version));

  return (
    <ReactFlowProvider>
      <CanvasStoreContext value={store}>
        <CanvasWorkspace {...props} />
      </CanvasStoreContext>
    </ReactFlowProvider>
  );
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

// 把轮询到的任务状态写回生成节点，成功时在右侧落下结果图
function applyTask(store: CanvasStore, nodeId: string, task: GenerationTask) {
  const state = store.getState();
  const node = state.nodes.find((item) => item.id === nodeId);
  if (node?.type !== "generator") return;
  if (!isTaskWaiting(node.data) || node.data.taskNo !== task.taskNo) return;

  if (task.status === "succeeded") {
    // 第一步：按结果顺序整理图片。
    const results = [...(task.results ?? [])];
    results.sort((resultA, resultB) => resultA.sortOrder - resultB.sortOrder);

    // 第二步：生成结果节点和连线。
    const images = placeResults(
      node,
      results.map((result) => {
        return {
          mediaAssetId: result.mediaAssetId,
          resultId: result.id,
          url: result.resultUrl,
          width: null,
          height: null,
        };
      }),
      task.ratio,
    );
    const edges = images.map((image) => createEdge(node.id, image.id));

    // 第三步：标记已落图，避免重复添加。
    const patch = { status: task.status, failReason: null, resultsApplied: true, retry: undefined };
    state.patchNode(nodeId, patch, images, edges);
    return;
  }

  const retry = readRetry(task);
  const isChanged =
    task.status !== node.data.status ||
    task.failReason !== node.data.failReason ||
    !isSameRetry(retry, node.data.retry);
  if (isChanged) {
    state.patchNode(nodeId, { status: task.status, failReason: task.failReason, retry });
  }
}

function CanvasWorkspace(props: CanvasEditorProps) {
  const board = props.board;
  const config = props.config;
  const models = props.models;
  const collections = props.collections;
  const defaults = props.defaults;

  const flow = useReactFlow<CanvasNode, Edge>();
  const store = useCanvasStoreApi();
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const revision = useCanvasStore((state) => state.revision);
  const savedRevision = useCanvasStore((state) => state.savedRevision);
  const canUndo = useCanvasStore((state) => state.past.length > 0);
  const canRedo = useCanvasStore((state) => state.future.length > 0);
  const pendingKey = useCanvasStore((state) => {
    const tasks = getPendingTasks(state.nodes);
    return tasks.map((task) => `${task.nodeId}:${task.taskNo}`).join("|");
  });
  const selectedResult = useCanvasStore((state) => {
    const selected = state.nodes.filter((node) => node.selected);
    const node = selected[0];
    if (selected.length !== 1 || node?.type !== "image" || !node.data.resultId) {
      return null;
    }

    return node;
  });

  const [initialViewport] = useState(() => store.getState().viewport);
  const [hasInitialNodes] = useState(() => store.getState().nodes.length > 0);
  const [balance, setBalance] = useState(props.balance);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [notice, setNotice] = useState("");
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [maskNode, setMaskNode] = useState<ImageNode | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isSavingRef = useRef(false);
  const isConflictRef = useRef(false);

  let saveStatus: SaveStatus = "dirty";
  if (saveState === "conflict") {
    saveStatus = "conflict";
  } else if (saveState === "saving") {
    saveStatus = "saving";
  } else if (saveState === "error") {
    saveStatus = "error";
  } else if (revision === savedRevision) {
    saveStatus = "saved";
  }

  const save = useCallback(async () => {
    if (isConflictRef.current || isSavingRef.current) return;

    const state = store.getState();
    if (state.revision === state.savedRevision) return;

    // 第一步：整理需要保存的场景。
    const savedAt = state.revision;
    const scene = sceneFromFlow(state.nodes, state.edges, state.viewport);
    const request: SaveCanvasSceneRequest = {
      scene,
      version: state.version,
      nodeCount: scene.nodes.length,
    };
    const cover = pickCover(state.nodes);
    if (cover) request.coverMediaId = cover;

    // 第二步：超出场景体积上限时不提交。
    const sceneKb = new Blob([JSON.stringify(scene)]).size / 1024;
    if (sceneKb > config.maxSceneKb) {
      setSaveState("error");
      setNotice(`画布内容超出 ${config.maxSceneKb} KB 上限`);
      return;
    }

    isSavingRef.current = true;
    setSaveState("saving");
    try {
      const result = await canvasBoardsApi.saveScene(board.id, request);
      store.getState().markSaved(savedAt, result.version);
      setSaveState("idle");
    } catch (error) {
      const isConflict = error instanceof ApiRequestError && error.status === 409;
      if (isConflict) {
        isConflictRef.current = true;
        setSaveState("conflict");
      } else {
        setSaveState("error");
        setNotice(getErrorMessage(error));
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [board.id, config.maxSceneKb, store]);

  useEffect(() => {
    if (revision === savedRevision) return;

    const timer = window.setTimeout(() => void save(), saveDelay);
    return () => window.clearTimeout(timer);
  }, [revision, savedRevision, save]);

  useEffect(() => {
    function saveHidden() {
      if (document.visibilityState === "hidden") void save();
    }
    function saveNow() {
      void save();
    }

    document.addEventListener("visibilitychange", saveHidden);
    window.addEventListener("pagehide", saveNow);
    return () => {
      document.removeEventListener("visibilitychange", saveHidden);
      window.removeEventListener("pagehide", saveNow);
      void save();
    };
  }, [save]);

  useEffect(() => {
    if (!notice) return;

    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!pendingKey) return;

    let disposed = false;
    let timer: number | undefined;

    async function poll() {
      const tasks = getPendingTasks(store.getState().nodes);
      for (const item of tasks) {
        try {
          const task = await generationTasksApi.fetchTask(item.taskNo);
          if (disposed) return;

          applyTask(store, item.nodeId, task);
        } catch {
          // 网络抖动时保留当前状态，下一轮继续轮询。
        }
      }

      if (!disposed) timer = window.setTimeout(poll, pollDelay);
    }

    timer = window.setTimeout(poll, pollDelay);
    return () => {
      disposed = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [pendingKey, store]);

  const hasRoom = useCallback(
    (extra: number) => {
      const total = store.getState().nodes.length + extra;
      if (total > config.maxNodesPerBoard) {
        setNotice(`每个画布最多 ${config.maxNodesPerBoard} 个节点`);
        return false;
      }

      return true;
    },
    [config.maxNodesPerBoard, store],
  );

  const getCenter = useCallback(
    (width: number) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) {
        return { x: 0, y: 0 };
      }

      const point = flow.screenToFlowPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      const offset = (store.getState().nodes.length % 5) * resultGap;

      return { x: point.x - width / 2 + offset, y: point.y - 120 + offset };
    },
    [flow, store],
  );

  const addGeneratorFor = useCallback(
    (image: ImageNode, mask: MediaAsset | null) => {
      if (!defaults) {
        setNotice("暂无可用图片模型");
        return;
      }
      if (!hasRoom(1)) return;

      let options = resolveOptions(defaults, models, "image_to_image");
      let extra = {};
      if (mask) {
        options = resolveOptions(defaults, models, "inpaint");
        extra = { referenceMediaId: image.data.mediaAssetId, maskMediaId: mask.id };
      }

      const position = {
        x: image.position.x + getNodeWidth(image) + nodeGap,
        y: image.position.y,
      };
      const generator = createGeneratorNode(position, options ?? defaults, extra);
      const state = store.getState();
      state.addNodes([generator], [createEdge(image.id, generator.id)]);
      state.setFocus(generator.id);
    },
    [defaults, hasRoom, models, store],
  );

  const generate = useCallback(
    async (nodeId: string) => {
      const state = store.getState();
      const node = state.nodes.find((item) => item.id === nodeId);
      if (node?.type !== "generator") return;

      // 第一步：根据上游连线推导模式并校正参数。
      const upstream = getUpstreamImage(nodeId, state.nodes, state.edges);
      const mode = getMode(node.data, upstream);
      const options = resolveOptions(node.data, models, mode);
      if (!options) {
        setNotice(`${modeLabels[mode]}暂无可用模型`);
        return;
      }

      // 第二步：前端先做数量限制提示，Java 仍会兜底校验。
      if (!node.data.prompt.trim()) {
        setNotice("请输入提示词");
        return;
      }
      if (countPending(state.nodes) >= config.maxPendingTasksPerBoard) {
        setNotice(`每个画布最多同时进行 ${config.maxPendingTasksPerBoard} 个生成任务`);
        return;
      }
      if (!hasRoom(options.count)) return;

      const request = buildTaskRequest(board.id, { ...node.data, ...options }, upstream);
      if (mode !== "text_to_image" && !request.referenceMediaId) {
        setNotice("参考图未就绪");
        return;
      }

      // 第三步：创建任务并把任务号写回节点。
      state.updateData(nodeId, options);
      try {
        const task = await generationTasksApi.createTask(request);
        const patch = {
          taskNo: task.taskNo,
          status: "pending",
          failReason: null,
          retry: undefined,
        };
        store.getState().patchNode(nodeId, { ...patch, resultsApplied: false });
        applyTask(store, nodeId, task);
        setBalance((current) => Math.max(0, current - task.requiredPoints));
        void save();
      } catch (error) {
        setNotice(getErrorMessage(error));
      }
    },
    [board.id, config.maxPendingTasksPerBoard, hasRoom, models, save, store],
  );

  const actions = useMemo<CanvasActions>(() => {
    return {
      canvasId: board.id,
      models,
      collections,
      balance,
      setBalance,
      generate,
      generateFrom(imageId) {
        const image = store.getState().nodes.find((node) => node.id === imageId);
        if (image?.type === "image") addGeneratorFor(image, null);
      },
      inpaint(imageId) {
        const image = store.getState().nodes.find((node) => node.id === imageId);
        if (image?.type === "image") setMaskNode(image);
      },
      remove(nodeId) {
        store.getState().removeNode(nodeId);
      },
    };
  }, [addGeneratorFor, balance, board.id, collections, generate, models, store]);

  async function uploadFiles(files: File[], position?: XYPosition) {
    if (files.length === 0) return;

    // 第一步：校验格式、大小和节点数量。
    const invalid = files.find((file) => !isSupportedImageType(file.type));
    if (invalid) {
      setNotice("仅支持 PNG、JPEG 和 WebP 图片");
      return;
    }
    const oversized = files.find((file) => file.size > maxImageBytes);
    if (oversized) {
      setNotice("单张图片不能超过 10 MB");
      return;
    }
    if (!hasRoom(files.length)) return;

    // 第二步：先放上传中的占位节点。
    const start = position ?? getCenter(imageNodeWidth);
    const placeholders = files.map((file, index) => {
      const point = { x: start.x + index * (imageNodeWidth + resultGap), y: start.y };
      return createImageNode(point, { name: file.name, isUploading: true });
    });
    store.getState().addNodes(placeholders);

    // 第三步：逐张上传并回填媒体信息。
    await Promise.all(
      files.map(async (file, index) => {
        const id = placeholders[index].id;
        try {
          const asset = await uploadMediaFile(file);
          store.getState().patchNode(id, {
            mediaAssetId: asset.id,
            width: asset.width,
            height: asset.height,
            name: asset.originalName ?? file.name,
            isUploading: false,
          });
        } catch (error) {
          store.getState().changeNodes([{ type: "remove", id }]);
          setNotice(getErrorMessage(error));
        }
      }),
    );
  }

  function addGenerator() {
    if (!defaults) {
      setNotice("暂无可用图片模型");
      return;
    }
    if (!hasRoom(1)) return;

    const node = createGeneratorNode(getCenter(generatorNodeWidth), defaults);
    const state = store.getState();
    state.addNodes([node]);
    state.setFocus(node.id);
  }

  function addNote() {
    if (!hasRoom(1)) return;

    store.getState().addNodes([createNoteNode(getCenter(noteNodeWidth))]);
  }

  function addPicked(images: PickedImage[]) {
    setHistoryOpen(false);
    if (!hasRoom(images.length)) return;

    const start = getCenter(imageNodeWidth);
    const created = images.map((image, index) => {
      const point = { x: start.x + index * (imageNodeWidth + resultGap), y: start.y };
      return createImageNode(point, {
        mediaAssetId: image.result.mediaAssetId,
        resultId: image.result.id,
        url: image.result.resultUrl,
      });
    });
    store.getState().addNodes(created);
  }

  function confirmMask(mask: MediaAsset) {
    const image = maskNode;
    setMaskNode(null);
    if (image) addGeneratorFor(image, mask);
  }

  function dropFiles(event: DragEvent<HTMLDivElement>) {
    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    event.preventDefault();
    const position = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    void uploadFiles(files, position);
  }

  function allowDrop(event: DragEvent<HTMLDivElement>) {
    const hasFiles = event.dataTransfer.types.includes("Files");
    if (!hasFiles) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) return;

    const hasModifier = event.metaKey || event.ctrlKey;
    if (!hasModifier) return;

    const key = event.key.toLowerCase();
    const isRedo = (key === "z" && event.shiftKey) || key === "y";
    const state = store.getState();
    if (isRedo) {
      event.preventDefault();
      state.redo();
      return;
    }
    if (key === "z") {
      event.preventDefault();
      state.undo();
    }
  });

  const onPaste = useEffectEvent((event: ClipboardEvent) => {
    if (isEditableTarget(event.target)) return;

    const files = Array.from(event.clipboardData?.files ?? []);
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;

    event.preventDefault();
    void uploadFiles(images);
  });

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      onKeyDown(event);
    }
    function handlePaste(event: ClipboardEvent) {
      onPaste(event);
    }

    window.addEventListener("keydown", handleKey);
    document.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("paste", handlePaste);
    };
  }, []);

  function checkConnection(connection: Connection | Edge) {
    const state = store.getState();
    return isValidConnection(connection, state.nodes, state.edges);
  }

  let maskUrl = "";
  if (maskNode) {
    maskUrl = getImageSrc(maskNode.data) ?? "";
  }

  return (
    <CanvasContext value={actions}>
      <div ref={wrapperRef} className={styles.editor} onDragOver={allowDrop} onDrop={dropFiles}>
        <ReactFlow<CanvasNode, Edge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={(changes) => store.getState().changeNodes(changes)}
          onEdgesChange={(changes) => store.getState().changeEdges(changes)}
          onConnect={(connection) => store.getState().connect(connection)}
          isValidConnection={checkConnection}
          onBeforeDelete={async () => {
            store.getState().record();
            return true;
          }}
          onNodeDragStart={() => store.getState().record()}
          onMoveEnd={(_, viewport) => store.getState().setViewport(viewport)}
          defaultViewport={initialViewport}
          fitView={hasInitialNodes}
          fitViewOptions={{ maxZoom: 1 }}
          minZoom={0.1}
          maxZoom={2}
          deleteKeyCode={["Backspace", "Delete"]}
          multiSelectionKeyCode={["Meta", "Control"]}
        >
          <Background gap={24} />
          <MiniMap pannable zoomable />
          <Controls showInteractive={false} />
          <Panel position="top-left">
            <CanvasToolbar
              title={board.title}
              balance={balance}
              saveStatus={saveStatus}
              canUndo={canUndo}
              canRedo={canRedo}
              onAddGenerator={addGenerator}
              onAddNote={addNote}
              onUpload={(files) => void uploadFiles(files)}
              onOpenHistory={() => setHistoryOpen(true)}
              onUndo={() => store.getState().undo()}
              onRedo={() => store.getState().redo()}
              onFitView={() => void flow.fitView({ maxZoom: 1, duration: 200 })}
              onReload={() => window.location.reload()}
            />
          </Panel>
          {selectedResult?.data.resultId && selectedResult.data.mediaAssetId ? (
            <Panel position="top-right">
              <div className={styles.resultActions}>
                <CanvasResultActions
                  key={selectedResult.data.resultId}
                  resultId={selectedResult.data.resultId}
                  mediaAssetId={selectedResult.data.mediaAssetId}
                  collections={collections}
                />
              </div>
            </Panel>
          ) : null}
          {notice ? (
            <Panel position="bottom-center">
              <p className={styles.notice} role="status">
                {notice}
              </p>
            </Panel>
          ) : null}
        </ReactFlow>
      </div>

      {isHistoryOpen ? (
        <CanvasHistoryPicker onCancel={() => setHistoryOpen(false)} onConfirm={addPicked} />
      ) : null}
      {maskNode ? (
        <MaskEditorDialog
          open
          imageUrl={maskUrl}
          width={maskNode.data.width}
          height={maskNode.data.height}
          onCancel={() => setMaskNode(null)}
          onConfirm={confirmMask}
        />
      ) : null}
    </CanvasContext>
  );
}
