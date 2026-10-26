"use client";

import clsx from "clsx";
import { Check, Frame, Pencil, Plus, Trash2, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { canvasBoardsApi } from "@/api/canvas/boards";
import { Sheet } from "@/components/ui/sheet";
import { translateApiError } from "@/i18n/api-error";
import type { CanvasBoard, CanvasConfig } from "@/types/canvas";
import { parseJavaDateTime } from "@/utils/java-time";
import { userAssetUrl } from "@/utils/media";
import styles from "./canvas-list.module.css";
import { Link, useRouter } from "@/i18n/navigation";

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

function getCover(board: CanvasBoard) {
  if (board.coverMediaId) {
    return userAssetUrl(board.coverMediaId);
  }

  return board.coverUrl;
}

export function CanvasDisabled() {
  const t = useTranslations("canvas.list");

  return (
    <main className={styles.canvasList}>
      <section className={styles.canvasList__empty}>
        <Frame size={24} />
        <p>{t("disabled")}</p>
      </section>
    </main>
  );
}

export function CanvasList(props: CanvasListProps) {
  const initialBoards = props.initialBoards;
  const config = props.config;

  const router = useRouter();
  const t = useTranslations("canvas.list");
  const tError = useTranslations("errors.api");
  const [boards, setBoards] = useState(initialBoards);
  const [error, setError] = useState("");
  const [isCreating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<CanvasBoard | null>(null);

  if (!config.enabled) {
    return <CanvasDisabled />;
  }

  async function create() {
    if (boards.length >= config.maxBoardsPerUser) {
      setError(t("maxBoards", { count: config.maxBoardsPerUser }));
      return;
    }

    setCreating(true);
    setError("");
    try {
      const board = await canvasBoardsApi.create({});
      router.push(`/canvas/${board.id}`);
    } catch (createError) {
      setError(translateApiError(createError, tError));
      setCreating(false);
    }
  }

  async function rename(id: string, title: string) {
    if (!title) {
      setError(t("nameRequired"));
      return false;
    }

    setBusyId(id);
    setError("");
    try {
      const updated = await canvasBoardsApi.rename(id, { title });
      setBoards((current) => current.map((item) => (item.id === id ? updated : item)));
      return true;
    } catch (renameError) {
      setError(translateApiError(renameError, tError));
      return false;
    } finally {
      setBusyId("");
    }
  }

  async function remove(board: CanvasBoard) {
    setDeleteCandidate(null);
    setBusyId(board.id);
    setError("");
    try {
      await canvasBoardsApi.remove(board.id);
      setBoards((current) => current.filter((item) => item.id !== board.id));
    } catch (removeError) {
      setError(translateApiError(removeError, tError));
    } finally {
      setBusyId("");
    }
  }

  return (
    <main className={styles.canvasList}>
      <header className={styles.canvasList__header}>
        <h1 className="page-title">{t("title")}</h1>
        <button
          type="button"
          className={styles.canvasList__createButton}
          disabled={isCreating}
          onClick={create}
        >
          <Plus size={15} />
          {t("create")}
        </button>
      </header>

      {error ? <p className={styles.canvasList__error}>{error}</p> : null}

      {boards.length > 0 ? (
        <section className={styles.canvasList__grid} aria-label={t("gridLabel")}>
          {boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              isBusy={busyId === board.id}
              onRename={rename}
              onDelete={setDeleteCandidate}
            />
          ))}
        </section>
      ) : (
        <section className={styles.canvasList__empty}>
          <Frame size={24} />
          <p>{t("empty")}</p>
        </section>
      )}

      <Sheet
        open={deleteCandidate !== null}
        onClose={() => setDeleteCandidate(null)}
        title={t("deleteTitle")}
        footer={
          <>
            <button
              type="button"
              className={styles.canvasList__dialogButton}
              onClick={() => setDeleteCandidate(null)}
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              className={clsx(styles.canvasList__dialogButton, styles.canvasList__dialogDanger)}
              onClick={() => {
                if (deleteCandidate) void remove(deleteCandidate);
              }}
            >
              {t("deleteConfirm")}
            </button>
          </>
        }
      >
        <p className={styles.canvasList__dialogText}>
          {t("deleteDescription", { title: deleteCandidate?.title ?? "" })}
        </p>
      </Sheet>
    </main>
  );
}

function BoardCard(props: BoardCardProps) {
  const board = props.board;
  const isBusy = props.isBusy;
  const onRename = props.onRename;
  const onDelete = props.onDelete;
  const t = useTranslations("canvas.list");
  const format = useFormatter();

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
              aria-label={t("nameLabel")}
              onChange={(event) => setTitle(event.target.value)}
            />
            <button
              type="submit"
              aria-label={t("saveName")}
              title={t("saveName")}
              className={styles.canvasList__iconButton}
              disabled={isBusy}
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              aria-label={t("cancel")}
              title={t("cancel")}
              className={styles.canvasList__iconButton}
              onClick={() => setEditing(false)}
            >
              <X size={14} />
            </button>
          </form>
        ) : (
          <div className={styles.canvasList__titleRow}>
            <Link
              href={`/canvas/${board.id}`}
              className={styles.canvasList__title}
              title={board.title}
            >
              {board.title}
            </Link>
            <button
              type="button"
              aria-label={t("rename")}
              title={t("rename")}
              className={styles.canvasList__iconButton}
              disabled={isBusy}
              onClick={startEdit}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              aria-label={t("delete")}
              title={t("delete")}
              className={styles.canvasList__iconButton}
              disabled={isBusy}
              onClick={() => onDelete(board)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
        <p className={styles.canvasList__meta}>
          {t("meta", {
            count: board.nodeCount,
            time: format.dateTime(parseJavaDateTime(board.updateTime), "datetime"),
          })}
        </p>
      </div>
    </article>
  );
}
