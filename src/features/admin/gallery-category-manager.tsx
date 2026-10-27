"use client";

import clsx from "clsx";
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Tags, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { adminGalleryCategoryApi } from "@/api/admin/gallery";
import type { AdminGalleryCategory } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import workspace from "./admin-workspace.module.css";
import styles from "./gallery-category-manager.module.css";

type GalleryCategoryManagerProps = {
  initialCategories: AdminGalleryCategory[];
};

type NameForm = {
  nameZh: string;
  nameEn: string;
  nameRu: string;
};

const emptyCreateForm = { code: "", nameZh: "", nameEn: "", nameRu: "" };

function toNameForm(category: AdminGalleryCategory): NameForm {
  return {
    nameZh: category.nameZh,
    nameEn: category.nameEn ?? "",
    nameRu: category.nameRu ?? "",
  };
}

// 把 fromIndex 的分类移动到 toIndex，返回新数组
function move(list: AdminGalleryCategory[], fromIndex: number, toIndex: number) {
  const next = [...list];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/** 画廊分类管理：新增、改名（中/英/俄）、拖拽或箭头排序、启用/停用、删除（有作品时需转移）。 */
export function GalleryCategoryManager(props: GalleryCategoryManagerProps) {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const [categories, setCategories] = useState(props.initialCategories);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState<NameForm>({ nameZh: "", nameEn: "", nameRu: "" });
  const [deleteId, setDeleteId] = useState("");
  const [reassignTo, setReassignTo] = useState("");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setError] = useState(false);
  const [hasChanged, setChanged] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function closeByEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("keydown", closeByEscape);
    return () => document.removeEventListener("keydown", closeByEscape);
  }, [isOpen]);

  function showMessage(text: string, hasError: boolean) {
    setMessage(text);
    setError(hasError);
  }

  async function open() {
    setOpen(true);
    setMessage("");
    try {
      setCategories(await adminGalleryCategoryApi.list());
    } catch (error) {
      showMessage(getErrorMessage(error), true);
    }
  }

  function close() {
    setOpen(false);
    setEditId("");
    setDeleteId("");
    // 分类筛选和审核下拉都来自服务端，关闭时刷新一次
    if (hasChanged) {
      setChanged(false);
      router.refresh();
    }
  }

  async function run(key: string, action: () => Promise<void>, success: string) {
    setBusy(key);
    setMessage("");
    try {
      await action();
      setChanged(true);
      showMessage(success, false);
    } catch (error) {
      showMessage(getErrorMessage(error), true);
    } finally {
      setBusy("");
    }
  }

  function create() {
    void run(
      "create",
      async () => {
        await adminGalleryCategoryApi.create({
          code: createForm.code.trim(),
          nameZh: createForm.nameZh.trim(),
          nameEn: createForm.nameEn.trim(),
          nameRu: createForm.nameRu.trim(),
        });
        setCreateForm(emptyCreateForm);
        setCategories(await adminGalleryCategoryApi.list());
      },
      "已新增分类",
    );
  }

  function startEdit(category: AdminGalleryCategory) {
    setDeleteId("");
    setEditId(category.id);
    setEditForm(toNameForm(category));
  }

  function saveEdit(category: AdminGalleryCategory) {
    void run(
      category.id,
      async () => {
        const saved = await adminGalleryCategoryApi.update(category.id, editForm);
        setCategories((list) => list.map((item) => (item.id === saved.id ? saved : item)));
        setEditId("");
      },
      "已保存",
    );
  }

  function toggleStatus(category: AdminGalleryCategory) {
    let status: AdminGalleryCategory["status"] = "enabled";
    if (category.status === "enabled") {
      status = "disabled";
    }

    void run(
      category.id,
      async () => {
        const saved = await adminGalleryCategoryApi.update(category.id, { status });
        setCategories((list) => list.map((item) => (item.id === saved.id ? saved : item)));
      },
      status === "enabled" ? "已启用" : "已停用",
    );
  }

  function reorder(next: AdminGalleryCategory[]) {
    const previous = categories;
    setCategories(next);
    void run(
      "reorder",
      async () => {
        try {
          setCategories(
            await adminGalleryCategoryApi.reorder({ ids: next.map((item) => item.id) }),
          );
        } catch (error) {
          setCategories(previous);
          throw error;
        }
      },
      "已保存排序",
    );
  }

  function startDelete(category: AdminGalleryCategory) {
    setEditId("");
    setDeleteId(category.id);
    setReassignTo("other");
  }

  function confirmDelete(category: AdminGalleryCategory) {
    let target: string | undefined;
    if (category.imageCount > 0) {
      target = reassignTo;
    }

    void run(
      category.id,
      async () => {
        await adminGalleryCategoryApi.remove(category.id, target);
        setDeleteId("");
        setCategories(await adminGalleryCategoryApi.list());
      },
      "已删除分类",
    );
  }

  function dropOn(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }

    reorder(move(categories, dragIndex, index));
    setDragIndex(null);
  }

  const isBusy = busy !== "";
  const canCreate = createForm.code.trim() !== "" && createForm.nameZh.trim() !== "";

  return (
    <>
      <button type="button" className={workspace.secondaryAction} onClick={open}>
        <Tags size={14} aria-hidden="true" />
        分类管理
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            className={workspace.drawerBackdrop}
            aria-label="关闭"
            onClick={close}
          />
          <aside
            className={workspace.drawer}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gallery-category-title"
          >
            <header className={workspace.drawerHeader}>
              <h2 id="gallery-category-title" className={workspace.drawerTitle}>
                分类管理
              </h2>
              <button
                className={workspace.iconAction}
                type="button"
                aria-label="关闭"
                title="关闭"
                onClick={close}
              >
                <X size={16} />
              </button>
            </header>

            <div className={workspace.drawerBody}>
              {message ? (
                <p className={clsx(isError ? workspace.inlineAlert : workspace.inlineMessage)}>
                  {message}
                </p>
              ) : null}

              <p className={styles.manager__hint}>
                拖动或用箭头调整顺序，公开画廊的分类筛选按此顺序展示。英文、俄文名称留空时显示中文。停用后用户端不再展示该分类，已有作品仍在“全部”中可见。
              </p>

              <ol className={styles.manager__list}>
                {categories.map((category, index) => {
                  const isEditing = editId === category.id;
                  const isDeleting = deleteId === category.id;
                  const isRowBusy = busy === category.id;
                  const isDisabled = category.status === "disabled";
                  const targets = categories.filter((item) => item.id !== category.id);

                  return (
                    <li
                      key={category.id}
                      className={clsx(
                        styles.manager__row,
                        dragIndex === index && styles.manager__rowDragging,
                        isDisabled && styles.manager__rowDisabled,
                      )}
                      draggable={!isEditing && !isDeleting && !isBusy}
                      onDragStart={() => setDragIndex(index)}
                      onDragEnd={() => setDragIndex(null)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => dropOn(index)}
                    >
                      <div className={styles.manager__main}>
                        <GripVertical
                          size={15}
                          className={styles.manager__grip}
                          aria-hidden="true"
                        />
                        <div className={styles.manager__names}>
                          <span className={styles.manager__name}>
                            {category.nameZh}
                            <code className={styles.manager__code}>{category.code}</code>
                          </span>
                          <span className={styles.manager__sub}>
                            {category.nameEn || "—"} · {category.nameRu || "—"} ·{" "}
                            {category.imageCount} 个作品
                          </span>
                        </div>
                        <span
                          className={clsx(
                            workspace.status,
                            isDisabled ? workspace.statusDanger : workspace.statusSuccess,
                          )}
                        >
                          {isDisabled ? "已停用" : "启用中"}
                        </span>
                        <div className={styles.manager__actions}>
                          <button
                            type="button"
                            className={workspace.iconAction}
                            aria-label="上移"
                            title="上移"
                            disabled={index === 0 || isBusy}
                            onClick={() => reorder(move(categories, index, index - 1))}
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className={workspace.iconAction}
                            aria-label="下移"
                            title="下移"
                            disabled={index === categories.length - 1 || isBusy}
                            onClick={() => reorder(move(categories, index, index + 1))}
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            className={workspace.iconAction}
                            aria-label="改名"
                            title="改名"
                            disabled={isBusy}
                            onClick={() => startEdit(category)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className={workspace.textAction}
                            disabled={isBusy || category.isDefault}
                            title={category.isDefault ? "默认分类不能停用" : undefined}
                            onClick={() => toggleStatus(category)}
                          >
                            {isDisabled ? "启用" : "停用"}
                          </button>
                          <button
                            type="button"
                            className={workspace.iconAction}
                            aria-label="删除"
                            title={category.isDefault ? "默认分类不能删除" : "删除"}
                            disabled={isBusy || category.isDefault}
                            onClick={() => startDelete(category)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {isEditing ? (
                        <div className={styles.manager__panel}>
                          <div className={styles.manager__fields}>
                            <input
                              className={workspace.formField}
                              value={editForm.nameZh}
                              maxLength={50}
                              placeholder="中文名称"
                              aria-label="中文名称"
                              onChange={(event) =>
                                setEditForm({ ...editForm, nameZh: event.target.value })
                              }
                            />
                            <input
                              className={workspace.formField}
                              value={editForm.nameEn}
                              maxLength={50}
                              placeholder="English"
                              aria-label="英文名称"
                              onChange={(event) =>
                                setEditForm({ ...editForm, nameEn: event.target.value })
                              }
                            />
                            <input
                              className={workspace.formField}
                              value={editForm.nameRu}
                              maxLength={50}
                              placeholder="Русский"
                              aria-label="俄文名称"
                              onChange={(event) =>
                                setEditForm({ ...editForm, nameRu: event.target.value })
                              }
                            />
                          </div>
                          <div className={styles.manager__panelActions}>
                            <button
                              type="button"
                              className={workspace.secondaryAction}
                              onClick={() => setEditId("")}
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              className={workspace.primaryAction}
                              disabled={isRowBusy || editForm.nameZh.trim() === ""}
                              onClick={() => saveEdit(category)}
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {isDeleting ? (
                        <div className={styles.manager__panel}>
                          {category.imageCount > 0 ? (
                            <label className={styles.manager__reassign}>
                              <span>该分类下有 {category.imageCount} 个作品，删除前转到</span>
                              <select
                                className={workspace.formField}
                                value={reassignTo}
                                onChange={(event) => setReassignTo(event.target.value)}
                              >
                                {targets.map((item) => (
                                  <option key={item.id} value={item.code}>
                                    {item.nameZh}
                                    {item.status === "disabled" ? "（停用）" : ""}
                                  </option>
                                ))}
                              </select>
                            </label>
                          ) : (
                            <span className={styles.manager__sub}>
                              该分类没有作品，可以直接删除。
                            </span>
                          )}
                          <div className={styles.manager__panelActions}>
                            <button
                              type="button"
                              className={workspace.secondaryAction}
                              onClick={() => setDeleteId("")}
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              className={workspace.dangerAction}
                              disabled={isRowBusy}
                              onClick={() => confirmDelete(category)}
                            >
                              确认删除
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ol>

              <section className={styles.manager__create}>
                <h3 className={workspace.formSectionTitle}>新增分类</h3>
                <div className={styles.manager__fields}>
                  <input
                    className={workspace.formField}
                    value={createForm.code}
                    maxLength={30}
                    placeholder="代码，如 landscape"
                    aria-label="分类代码"
                    onChange={(event) => setCreateForm({ ...createForm, code: event.target.value })}
                  />
                  <input
                    className={workspace.formField}
                    value={createForm.nameZh}
                    maxLength={50}
                    placeholder="中文名称"
                    aria-label="中文名称"
                    onChange={(event) =>
                      setCreateForm({ ...createForm, nameZh: event.target.value })
                    }
                  />
                  <input
                    className={workspace.formField}
                    value={createForm.nameEn}
                    maxLength={50}
                    placeholder="English（可选）"
                    aria-label="英文名称"
                    onChange={(event) =>
                      setCreateForm({ ...createForm, nameEn: event.target.value })
                    }
                  />
                  <input
                    className={workspace.formField}
                    value={createForm.nameRu}
                    maxLength={50}
                    placeholder="Русский（可选）"
                    aria-label="俄文名称"
                    onChange={(event) =>
                      setCreateForm({ ...createForm, nameRu: event.target.value })
                    }
                  />
                </div>
                <p className={workspace.fieldHint}>
                  代码用于网址和数据存储，创建后不能修改：小写字母开头，可含数字和短横线，2 到 30
                  位。
                </p>
                <div className={styles.manager__panelActions}>
                  <button
                    type="button"
                    className={workspace.primaryAction}
                    disabled={!canCreate || isBusy}
                    onClick={create}
                  >
                    <Plus size={14} aria-hidden="true" />
                    添加分类
                  </button>
                </div>
              </section>
            </div>
          </aside>
        </>
      ) : null}
    </>
  );
}
