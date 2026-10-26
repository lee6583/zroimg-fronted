"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Frame, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { canvasBoardsApi } from "@/api/canvas/boards";
import type { CanvasBoard, CanvasConfig } from "@/types/canvas";
import { getErrorMessage } from "@/utils/error";
import { userAssetUrl } from "@/utils/media";
import styles from "./canvas-list.module.css";

type CanvasListProps = {
  initialBoards: CanvasBoard[];
  config: CanvasConfig;
};

type BoardCardProps = {
  board: CanvasBoard;
  isBusy: boolean;
  onRename: (id: string, title: string) => Promise<boolean>;
  onDelete: (board: CanvasBoard) => void;
};

function formatTime(value: string) {
  return value.replace("T", " ").slice(0, 16);
}

function getCover(board: CanvasBoard) {
  if (board.coverMediaId) {
    return userAssetUrl(board.coverMediaId);
  }

  return board.coverUrl;
}

export function CanvasDisabled() {
  return (
    <main className={styles.canvasList}>
      <section className={styles.canvasList__empty}>
        <Frame size={24} />
        <p>无限画布暂未开放</p>
      </section>
    </main>
  );
}

export function CanvasList(props: CanvasListProps) {
  const initialBoards = props.initialBoards;
  const config = props.config;

  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [error, setError] = useState("");
  const [isCreating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState("");

  if (!config.enabled) {
    return <CanvasDisabled />;
  }

  async function create() {
    if (boards.length >= config.maxBoardsPerUser) {
      setError(`最多创建 ${config.maxBoardsPerUser} 个画布`);
      return;
    }

    setCreating(true);
    setError("");
    try {
      const board = await canvasBoardsApi.create({});
      router.push(`/canvas/${board.id}`);
    } catch (createError) {
      setError(getErrorMessage(createError));
      setCreating(false);
    }
  }

  async function rename(id: string, title: string) {
    if (!title) {
      setError("画布名称不能为空");
      return false;
    }

    setBusyId(id);
    setError("");
    try {
      const updated = await canvasBoardsApi.rename(id, { title });
      setBoards((current) => current.map((item) => (item.id === id ? updated : item)));
      return true;
    } catch (renameError) {
      setError(getErrorMessage(renameError));
      return false;
    } finally {
      setBusyId("");
    }
  }

  async function remove(board: CanvasBoard) {
    const shouldDelete = window.confirm(`确定删除画布“${board.title}”吗？删除后无法恢复。`);
    if (!shouldDelete) return;

    setBusyId(board.id);
    setError("");
    try {
      await canvasBoardsApi.remove(board.id);
      setBoards((current) => current.filter((item) => item.id !== board.id));
    } catch (removeError) {
      setError(getErrorMessage(removeError));
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className={styles.canvasList}>
      <header className={styles.canvasList__header}>
        <h1 className="page-title">无限画布</h1>
        <button
          type="button"
          className={styles.canvasList__createButton}
          disabled={isCreating}
          onClick={create}
        >
          <Plus size={15} />
          新建画布
        </button>
      </header>

      {error ? <p className={styles.canvasList__error}>{error}</p> : null}

      {boards.length > 0 ? (
        <section className={styles.canvasList__grid} aria-label="画布列表">
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              isBusy={busyId === board.id}
              onRename={rename}
              onDelete={remove}
            />
          ))}
        </section>
      ) : (
        <section className={styles.canvasList__empty}>
          <Frame size={24} />
          <p>还没有画布</p>
        </section>
      )}
    </main>
  );
}

function BoardCard(props: BoardCardProps) {
  const board = props.board;
  const isBusy = props.isBusy;
  const onRename = props.onRename;
  const onDelete = props.onDelete;

  const [isEditing, setEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const cover = getCover(board);

  function startEdit() {
    setTitle(board.title);
    setEditing(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isSaved = await onRename(board.id, title.trim());
    if (isSaved) setEditing(false);
  }

  return (
    <article className={styles.canvasList__card}>
      <Link href={`/canvas/${board.id}`} className={styles.canvasList__cover}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.canvasList__coverImage} src={cover} alt={board.title} />
        ) : (
          <Frame size={22} />
        )}
      </Link>

      <div className={styles.canvasList__body}>
        {isEditing ? (
          <form className={styles.canvasList__renameForm} onSubmit={submit}>
            <input
              className={styles.canvasList__input}
              value={title}
              maxLength={60}
              autoFocus
              aria-label="画布名称"
              onChange={(event) => setTitle(event.target.value)}
            />
            <button
              type="submit"
              aria-label="保存名称"
              className={styles.canvasList__iconButton}
              disabled={isBusy}
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              aria-label="取消"
              className={styles.canvasList__iconButton}
              onClick={() => setEditing(false)}
            >
              <X size={14} />
            </button>
          </form>
        ) : (
          <div className={styles.canvasList__titleRow}>
            <Link href={`/canvas/${board.id}`} className={styles.canvasList__title}>
              {board.title}
            </Link>
            <button
              type="button"
              aria-label="重命名"
              title="重命名"
              className={styles.canvasList__iconButton}
              disabled={isBusy}
              onClick={startEdit}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              aria-label="删除"
              title="删除"
              className={styles.canvasList__iconButton}
              disabled={isBusy}
              onClick={() => onDelete(board)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
        <p className={styles.canvasList__meta}>
          {board.nodeCount} 个节点 · {formatTime(board.updateTime)}
        </p>
      </div>
    </article>
  );
}
