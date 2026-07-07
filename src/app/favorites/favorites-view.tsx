"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderHeart, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createFavoriteCollection,
  deleteFavoriteCollection,
  updateFavoriteCollection,
} from "@/api/generation/favorites";
import styles from "./favorites.module.css";

type FavoriteCollectionItem = {
  id: string;
  name: string;
  imageCount: number;
};

function joinClassNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function FavoriteCollectionsView({ collections }: { collections: FavoriteCollectionItem[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [actionId, setActionId] = useState("");

  async function createCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await createFavoriteCollection({ name });
    } catch (error) {
      setError(error instanceof Error ? error.message : "创建合集失败");
      setLoading(false);
      return;
    }

    setName("");
    setCreating(false);
    router.refresh();
    setLoading(false);
  }

  function cancelCreate() {
    setName("");
    setError("");
    setCreating(false);
  }

  function openCollection(collectionId: string) {
    if (editingId) return;
    router.push(`/favorites/${collectionId}`);
  }

  function startEdit(collection: FavoriteCollectionItem) {
    setError("");
    setEditingId(collection.id);
    setEditingName(collection.name);
  }

  function cancelEdit() {
    setEditingId("");
    setEditingName("");
    setError("");
  }

  async function saveCollectionName(event: FormEvent<HTMLFormElement>, collectionId: string) {
    event.preventDefault();

    setActionId(collectionId);
    setError("");

    try {
      await updateFavoriteCollection(collectionId, { name: editingName });
    } catch (error) {
      setError(error instanceof Error ? error.message : "更新合集失败");
      setActionId("");
      return;
    }

    setEditingId("");
    setEditingName("");
    router.refresh();
    setActionId("");
  }

  async function deleteCollection(collectionId: string) {
    const confirmed = window.confirm("确定删除这个合集吗？合集里的图片不会被删除。");
    if (!confirmed) return;

    setActionId(collectionId);
    setError("");

    try {
      await deleteFavoriteCollection(collectionId);
    } catch (error) {
      setError(error instanceof Error ? error.message : "删除合集失败");
      setActionId("");
      return;
    }

    router.refresh();
    setActionId("");
  }

  return (
    <main className={styles.favorites}>
      <section className={styles.favorites__header}>
        <div>
          <h1 className={styles.favorites__title}>收藏合集</h1>
          <p className={styles.favorites__description}>管理你的收藏夹和合集</p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className={styles.favorites__createButton}
        >
          <Plus size={17} />
          新建合集
        </button>
      </section>

      {creating ? (
        <form className={styles.favorites__createPanel} onSubmit={createCollection}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={styles.favorites__input}
            placeholder="输入合集名称"
            autoFocus
          />
          <button type="submit" disabled={loading} className={styles.favorites__submitButton}>
            {loading ? "创建中" : "创建"}
          </button>
          <button type="button" onClick={cancelCreate} className={styles.favorites__cancelButton}>
            取消
          </button>
          {error ? <p className={styles.favorites__error}>{error}</p> : null}
        </form>
      ) : null}

      <section className={joinClassNames(styles.favorites__grid, collections.length === 0 && styles.favorites__gridEmpty)}>
        {collections.map((collection) => (
          <article
            key={collection.id}
            className={styles.favorites__card}
            role="link"
            tabIndex={0}
            onClick={() => openCollection(collection.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter") openCollection(collection.id);
            }}
          >
            <span className={styles.favorites__cardIcon}>
              <FolderHeart size={23} />
            </span>
            <div className={styles.favorites__cardText}>
              {editingId === collection.id ? (
                <form
                  className={styles.favorites__renameForm}
                  onSubmit={(event) => saveCollectionName(event, collection.id)}
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className={styles.favorites__renameInput}
                    autoFocus
                  />
                  <button type="submit" disabled={actionId === collection.id} className={styles.favorites__smallButton}>
                    保存
                  </button>
                  <button type="button" onClick={cancelEdit} className={styles.favorites__smallButton}>
                    取消
                  </button>
                </form>
              ) : (
                <h2 className={styles.favorites__cardTitle}>{collection.name}</h2>
              )}
              <p className={styles.favorites__cardMeta}>{collection.imageCount} 张图片</p>
            </div>
            {editingId !== collection.id ? (
              <div className={styles.favorites__cardActions}>
                <button
                  type="button"
                  aria-label="编辑合集名称"
                  className={styles.favorites__iconButton}
                  onClick={(event) => {
                    event.stopPropagation();
                    startEdit(collection);
                  }}
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  aria-label="删除合集"
                  disabled={actionId === collection.id}
                  className={styles.favorites__iconButton}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteCollection(collection.id);
                  }}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ) : null}
          </article>
        ))}

        {error && collections.length > 0 ? <p className={styles.favorites__listError}>{error}</p> : null}

        {collections.length === 0 ? (
          <div className={styles.favorites__empty}>
            <span className={styles.favorites__cardIcon}>
              <FolderHeart size={23} />
            </span>
            <div className={styles.favorites__emptyText}>
              <h2 className={styles.favorites__emptyTitle}>还没有合集</h2>
              <p className={styles.favorites__emptyMeta}>点击右上角新建一个合集</p>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
