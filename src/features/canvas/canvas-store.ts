import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { createContext, useContext } from "react";
import { useStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import type { CanvasViewport } from "@/types/canvas";
import type { CanvasFlow, CanvasNode } from "./canvas-model";

type Snapshot = {
  nodes: CanvasNode[];
  edges: Edge[];
};

type CanvasState = {
  nodes: CanvasNode[];
  edges: Edge[];
  viewport: CanvasViewport;
  past: Snapshot[];
  future: Snapshot[];
  revision: number;
  savedRevision: number;
  version: number;
  focusId: string | null;
  record: () => void;
  changeNodes: (changes: NodeChange<CanvasNode>[]) => void;
  changeEdges: (changes: EdgeChange[]) => void;
  connect: (connection: Connection) => void;
  addNodes: (nodes: CanvasNode[], edges?: Edge[]) => void;
  updateData: (id: string, patch: Record<string, unknown>) => void;
  patchNode: (id: string, patch: NodePatch, nodes?: CanvasNode[], edges?: Edge[]) => void;
  removeNode: (id: string) => void;
  setViewport: (viewport: CanvasViewport) => void;
  undo: () => void;
  redo: () => void;
  markSaved: (revision: number, version: number) => void;
  setFocus: (id: string | null) => void;
};

type NodePatch = Record<string, unknown>;

const maxHistory = 50;

function pushLimited(stack: Snapshot[], snapshot: Snapshot) {
  const next = [...stack, snapshot];
  if (next.length > maxHistory) {
    next.shift();
  }

  return next;
}

// 任务状态、生成结果和上传结果不是用户编辑，同步写进历史快照，撤销时不会丢失
function patchSnapshot(
  snapshot: Snapshot,
  id: string,
  patch: NodePatch,
  nodes: CanvasNode[],
  edges: Edge[],
): Snapshot {
  const hasNode = snapshot.nodes.some((node) => node.id === id);
  if (!hasNode) {
    return snapshot;
  }

  const patched = snapshot.nodes.map((node) => {
    if (node.id !== id) return node;

    return { ...node, data: { ...node.data, ...patch } } as CanvasNode;
  });

  return {
    nodes: [...patched, ...nodes],
    edges: [...snapshot.edges, ...edges],
  };
}

function isPersistentNodeChange(change: NodeChange<CanvasNode>) {
  if (change.type === "position") {
    return !change.dragging;
  }

  return change.type === "add" || change.type === "remove" || change.type === "replace";
}

function isPersistentEdgeChange(change: EdgeChange) {
  return change.type === "add" || change.type === "remove" || change.type === "replace";
}

type CanvasStore = StoreApi<CanvasState>;

export function createCanvasStore(flow: CanvasFlow, version: number): CanvasStore {
  return createStore<CanvasState>()((set, get) => ({
    nodes: flow.nodes,
    edges: flow.edges,
    viewport: flow.viewport,
    past: [],
    future: [],
    revision: 0,
    savedRevision: 0,
    version,
    focusId: null,

    record() {
      const state = get();
      const snapshot = { nodes: state.nodes, edges: state.edges };
      set({ past: pushLimited(state.past, snapshot), future: [] });
    },

    changeNodes(changes) {
      const state = get();
      const nodes = applyNodeChanges(changes, state.nodes);
      const isPersistent = changes.some(isPersistentNodeChange);
      if (isPersistent) {
        set({ nodes, revision: state.revision + 1 });
        return;
      }

      set({ nodes });
    },

    changeEdges(changes) {
      const state = get();
      const edges = applyEdgeChanges(changes, state.edges);
      const isPersistent = changes.some(isPersistentEdgeChange);
      if (isPersistent) {
        set({ edges, revision: state.revision + 1 });
        return;
      }

      set({ edges });
    },

    connect(connection) {
      get().record();
      const state = get();
      const edge = {
        id: `${connection.source}->${connection.target}`,
        source: connection.source,
        target: connection.target,
      };
      set({ edges: addEdge(edge, state.edges), revision: state.revision + 1 });
    },

    addNodes(nodes, edges) {
      get().record();
      const state = get();
      set({
        nodes: [...state.nodes, ...nodes],
        edges: [...state.edges, ...(edges ?? [])],
        revision: state.revision + 1,
      });
    },

    updateData(id, patch) {
      const state = get();
      const nodes = state.nodes.map((node) => {
        if (node.id !== id) return node;

        return { ...node, data: { ...node.data, ...patch } } as CanvasNode;
      });
      set({ nodes, revision: state.revision + 1 });
    },

    patchNode(id, patch, nodes, edges) {
      const state = get();
      const extraNodes = nodes ?? [];
      const extraEdges = edges ?? [];
      const current = patchSnapshot(
        { nodes: state.nodes, edges: state.edges },
        id,
        patch,
        extraNodes,
        extraEdges,
      );
      const past = state.past.map((item) => patchSnapshot(item, id, patch, extraNodes, extraEdges));
      const future = state.future.map((item) => {
        return patchSnapshot(item, id, patch, extraNodes, extraEdges);
      });

      set({
        nodes: current.nodes,
        edges: current.edges,
        past,
        future,
        revision: state.revision + 1,
      });
    },

    removeNode(id) {
      get().record();
      const state = get();
      const nodes = state.nodes.filter((node) => node.id !== id);
      const edges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
      set({ nodes, edges, revision: state.revision + 1 });
    },

    setViewport(viewport) {
      set({ viewport });
    },

    undo() {
      const state = get();
      const previous = state.past.at(-1);
      if (!previous) return;

      const current = { nodes: state.nodes, edges: state.edges };
      set({
        nodes: previous.nodes,
        edges: previous.edges,
        past: state.past.slice(0, -1),
        future: pushLimited(state.future, current),
        revision: state.revision + 1,
      });
    },

    redo() {
      const state = get();
      const next = state.future.at(-1);
      if (!next) return;

      const current = { nodes: state.nodes, edges: state.edges };
      set({
        nodes: next.nodes,
        edges: next.edges,
        past: pushLimited(state.past, current),
        future: state.future.slice(0, -1),
        revision: state.revision + 1,
      });
    },

    markSaved(revision, version) {
      set({ savedRevision: revision, version });
    },

    setFocus(id) {
      set({ focusId: id });
    },
  }));
}

export const CanvasStoreContext = createContext<CanvasStore | null>(null);

export function useCanvasStoreApi() {
  const store = useContext(CanvasStoreContext);
  if (!store) {
    throw new Error("CanvasStoreContext 未初始化");
  }

  return store;
}

export function useCanvasStore<Value>(selector: (state: CanvasState) => Value) {
  const store = useCanvasStoreApi();
  return useStore(store, selector);
}

export type { CanvasState, CanvasStore };
