"use client";

import clsx from "clsx";
import { Trash2 } from "lucide-react";
import { NodeToolbar, Position, type NodeProps } from "@xyflow/react";
import { useCanvasActions } from "../canvas-context";
import { noteNodeWidth, type NoteNode } from "../canvas-model";
import { useCanvasStoreApi } from "../canvas-store";
import styles from "../canvas-editor.module.css";

export function CanvasNoteNode(props: NodeProps<NoteNode>) {
  const id = props.id;
  const data = props.data;
  const selected = props.selected;
  const actions = useCanvasActions();
  const store = useCanvasStoreApi();

  function change(text: string) {
    store.getState().updateData(id, { text });
  }

  return (
    <div
      className={clsx(styles.node, styles.noteNode, selected && styles.nodeSelected)}
      style={{ width: noteNodeWidth }}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <div className={styles.nodeToolbar}>
          <button
            type="button"
            className={clsx(styles.nodeToolbar__button, styles.nodeToolbar__danger)}
            onClick={() => actions.remove(id)}
          >
            <Trash2 size={14} />
            删除
          </button>
        </div>
      </NodeToolbar>
      <textarea
        className={clsx("nodrag nowheel", styles.noteNode__text)}
        value={data.text}
        placeholder="便签"
        rows={4}
        maxLength={2000}
        onFocus={() => store.getState().record()}
        onChange={(event) => change(event.target.value)}
      />
    </div>
  );
}
