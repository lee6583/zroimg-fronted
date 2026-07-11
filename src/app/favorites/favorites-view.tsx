"use client";

import clsx from "clsx";
import { getErrorMessage } from "@/utils/error";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderHeart, Pencil, Plus, Trash2 } from "lucide-react";
import { favoriteCollectionsApi } from "@/api/generation/favorites";
import styles from "./favorites.module.css";

type FavoriteCollectionItem = {
  id: string;
  name: string;
  imageCount: number;
};

export function FavoriteCollectionsView({
  collections,
}: {
  collections: FavoriteCollectionItem[];
}) {
  const router = useRouter();
  const [isCreating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [pendingId, setPendingId] = useState("");

  async function createCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      await favoriteCollectionsApi.createCollection({ name });
    } catch (error) {
      setError(getErrorMessage(error));
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
    if (editId) return;
    router.push(`/favorites/${collectionId}`);
  }

  function startEdit(collection: FavoriteCollectionItem) {
    setError("");
    setEditId(collection.id);
    setEditName(collection.name);
  }

  function cancelEdit() {
    setEditId("");
    setEditName("");
    setError("");
  }

  async function saveCollectionName(event: FormEvent<HTMLFormElement>, collectionId: string) {
    event.preventDefault();

    setPendingId(collectionId);
    setError("");

    try {
      await favoriteCollectionsApi.updateCollection(collectionId, {
        name: editName,
      });
    } catch (error) {
      setError(getErrorMessage(error));
      setPendingId("");
      return;
    }

    setEditId("");
    setEditName("");
    router.refresh();
    setPendingId("");
  }

  async function deleteCollection(collectionId: string) {
    const confirmed = window.confirm("确定删除这个合集吗？合集里的图片不会被删除。");
    if (!confirmed) return;

    setPendingId(collectionId);
    setError("");

    try {
      await favoriteCollectionsApi.deleteCollection(collectionId);
    } catch (error) {
      setError(getErrorMessage(error));
      setPendingId("");
      return;
    }

    router.refresh();
    setPendingId("");
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

      {isCreating ? (
        <form className={styles.favorites__createPanel} onSubmit={createCollection}>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={styles.favorites__input}
            placeholder="输入合集名称"
            autoFocus
          />
          <button type="submit" disabled={isLoading} className={styles.favorites__submitButton}>
            {isLoading ? "创建中" : "创建"}
          </button>
          <button type="button" onClick={cancelCreate} className={styles.favorites__cancelButton}>
            取消
          </button>
          {error ? <p className={styles.favorites__error}>{error}</p> : null}
        </form>
      ) : null}

      <section
        className={clsx(
          styles.favorites__grid,
          collections.length === 0 && styles.favorites__gridEmpty,
        )}
      >
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
              {editId === collection.id ? (
                <form
                  className={styles.favorites__renameForm}
                  onSubmit={(event) => saveCollectionName(event, collection.id)}
                  onClick={(event) => event.stopPropagation()}
                >
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className={styles.favorites__renameInput}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={pendingId === collection.id}
                    className={styles.favorites__smallButton}
                  >
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className={styles.favorites__smallButton}
                  >
                    取消
                  </button>
                </form>
              ) : (
                <h2 className={styles.favorites__cardTitle}>{collection.name}</h2>
              )}
              <p className={styles.favorites__cardMeta}>{collection.imageCount} 张图片</p>
            </div>
            {editId !== collection.id ? (
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
                  disabled={pendingId === collection.id}
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

        {error && collections.length > 0 ? (
          <p className={styles.favorites__listError}>{error}</p>
        ) : null}

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
