"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import { FormEvent, useId, useState } from "react";
import { FolderHeart, Pencil, Plus, Trash2 } from "lucide-react";
import { favoriteCollectionsApi } from "@/api/generation/favorites";
import { Sheet } from "@/components/ui/sheet";
import { ConfirmSheet } from "@/features/history/confirm-sheet";
import { translateApiError } from "@/i18n/api-error";
import type { FavoriteCollection } from "@/types/favorites";
import styles from "./favorites.module.css";
import { useRouter } from "@/i18n/navigation";

type FavoriteCollectionsViewProps = {
  collections: FavoriteCollection[];
};

export function FavoriteCollectionsView(props: FavoriteCollectionsViewProps) {
  const collections = props.collections;

  const t = useTranslations("favorites");
  const tError = useTranslations("errors.api");
  const createFormId = useId();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<FavoriteCollection | null>(null);
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
      setError(translateApiError(error, tError));
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

  function startEdit(collection: FavoriteCollection) {
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
      setError(translateApiError(error, tError));
      setPendingId("");
      return;
    }

    setEditId("");
    setEditName("");
    router.refresh();
    setPendingId("");
  }

  async function deleteCollection(collectionId: string) {
    setPendingId(collectionId);
    setError("");

    try {
      await favoriteCollectionsApi.deleteCollection(collectionId);
    } catch (error) {
      setError(translateApiError(error, tError));
      setPendingId("");
      setDeleteTarget(null);
      return;
    }

    setDeleteTarget(null);
    router.refresh();
    setPendingId("");
  }

  return (
    <main className={styles.favorites}>
      <section className={styles.favorites__header}>
        <div>
          <h1 className="page-title">{t("title")}</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            setError("");
            setCreating(true);
          }}
          className={styles.favorites__createButton}
        >
          <Plus size={17} />
          {t("create.open")}
        </button>
      </section>

      <Sheet
        open={isCreating}
        onClose={cancelCreate}
        title={t("create.title")}
        isLocked={isLoading}
        className={styles.favorites__sheet}
        footer={
          <div className={styles.favorites__modalActions}>
            <button type="button" onClick={cancelCreate} className={styles.favorites__cancelButton}>
              {t("actions.cancel")}
            </button>
            <button
              type="submit"
              form={createFormId}
              disabled={isLoading}
              className={styles.favorites__submitButton}
            >
              {isLoading ? t("create.submitting") : t("create.submit")}
            </button>
          </div>
        }
      >
        <form
          id={createFormId}
          className={styles.favorites__createPanel}
          onSubmit={createCollection}
        >
          <label className={styles.favorites__field}>
            <span className={styles.favorites__srOnly}>{t("create.nameLabel")}</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={styles.favorites__input}
              placeholder={t("create.placeholder")}
              autoFocus
            />
          </label>

          {error ? <p className={styles.favorites__error}>{error}</p> : null}
        </form>
      </Sheet>

      <ConfirmSheet
        open={deleteTarget !== null}
        title={t("delete.title")}
        confirmLabel={t("delete.confirm")}
        cancelLabel={t("actions.cancel")}
        isDanger
        isLoading={Boolean(deleteTarget && pendingId === deleteTarget.id)}
        onConfirm={() => {
          if (deleteTarget) void deleteCollection(deleteTarget.id);
        }}
        onClose={() => setDeleteTarget(null)}
      >
        {t("delete.content", { name: deleteTarget?.name ?? "" })}
      </ConfirmSheet>

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
                    aria-label={t("create.nameLabel")}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={pendingId === collection.id}
                    className={styles.favorites__smallButton}
                  >
                    {t("actions.save")}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className={styles.favorites__smallButton}
                  >
                    {t("actions.cancel")}
                  </button>
                </form>
              ) : (
                <h2 className={styles.favorites__cardTitle} title={collection.name}>
                  {collection.name}
                </h2>
              )}
              <p className={styles.favorites__cardMeta}>
                {t("card.count", { count: collection.count.items })}
              </p>
            </div>
            {editId !== collection.id ? (
              <div className={styles.favorites__cardActions}>
                <button
                  type="button"
                  aria-label={t("actions.rename")}
                  title={t("actions.rename")}
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
                  aria-label={t("actions.delete")}
                  title={t("actions.delete")}
                  disabled={pendingId === collection.id}
                  className={styles.favorites__iconButton}
                  onClick={(event) => {
                    event.stopPropagation();
                    setError("");
                    setDeleteTarget(collection);
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
              <h2 className={styles.favorites__emptyTitle}>{t("empty.title")}</h2>
              <p className={styles.favorites__emptyMeta}>{t("empty.text")}</p>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
