"use client";

import clsx from "clsx";
import { Archive, Check, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import type { KeyboardEvent } from "react";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import { parseJavaDateTime } from "@/utils/java-time";
import type { GenerationConversation } from "@/types/generation";
import type { ConversationGroup } from "./generation-model";
import styles from "./generate-form.module.css";

const titlePreviewLength = 9;

type ConversationSidebarProps = {
  groups: ConversationGroup[];
  activeId: string;
  summary: string;
  isCreating: boolean;
  onOpenSettings: () => void;
  onCreate: () => Promise<unknown>;
  onSelect: (id: string) => Promise<void>;
  onRename: (id: string, title: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
};

function getDisplayTitle(value: string) {
  const normalized = value.trim();
  const chars = [...normalized];
  if (chars.length <= titlePreviewLength) return normalized;
  return `${chars.slice(0, titlePreviewLength).join("")}...`;
}

export function ConversationSidebar(props: ConversationSidebarProps) {
  const groups = props.groups;
  const activeId = props.activeId;
  const summary = props.summary;
  const isCreating = props.isCreating;
  const onOpenSettings = props.onOpenSettings;
  const onCreate = props.onCreate;
  const onSelect = props.onSelect;
  const onRename = props.onRename;
  const onDelete = props.onDelete;
  const t = useTranslations("generate");
  const format = useFormatter();

  const [editId, setEditId] = useState("");
  const [title, setTitle] = useState("");
  const [pendingId, setPendingId] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<GenerationConversation | null>(null);

  function startEdit(item: GenerationConversation) {
    setEditId(item.id);
    setTitle(item.title);
  }

  function cancelEdit() {
    setEditId("");
    setTitle("");
  }

  async function save(id: string) {
    const nextTitle = title.trim();
    setPendingId(id);
    try {
      const saved = await onRename(id, nextTitle);
      if (saved) cancelEdit();
    } finally {
      setPendingId("");
    }
  }

  async function remove(id: string) {
    setPendingId(id);
    try {
      await onDelete(id);
      if (editId === id) cancelEdit();
    } finally {
      setPendingId("");
    }
  }

  function confirmDelete() {
    const candidate = deleteCandidate;
    if (!candidate) return;

    setDeleteCandidate(null);
    void remove(candidate.id);
  }

  function onEditKeyDown(event: KeyboardEvent<HTMLInputElement>, id: string) {
    if (event.key === "Enter") {
      event.preventDefault();
      void save(id);
    }
    if (event.key === "Escape") cancelEdit();
  }

  return (
    <aside className={styles.generateForm__sidebar}>
      <div className={styles.generateForm__sidebarHeader}>
        <button
          type="button"
          onClick={onOpenSettings}
          className={styles.generateForm__settingsTrigger}
        >
          <span className={styles.generateForm__settingsIcon}>
            <Settings size={15} />
          </span>
          <span className={styles.generateForm__settingsCopy}>
            <span className={styles.generateForm__settingsTitle}>{t("settings.title")}</span>
            <span className={styles.generateForm__settingsMeta} title={summary}>
              {summary}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => void onCreate()}
          disabled={isCreating}
          className={styles.generateForm__newConversationButton}
        >
          <Plus size={15} />
          {t("conversation.create")}
        </button>
      </div>

      <div className={styles.generateForm__conversationScroll}>
        {groups.length ? (
          groups.map((group) => (
            <section key={group.key} className={styles.generateForm__conversationGroup}>
              <p className={styles.generateForm__conversationDate}>
                {group.time
                  ? format.dateTime(parseJavaDateTime(group.time), "short")
                  : t("conversation.unarchived")}
              </p>
              <div className={styles.generateForm__conversationList}>
                {group.items.map((item) => {
                  const isActive = item.id === activeId;
                  const isEditing = item.id === editId;
                  const isPending = item.id === pendingId;
                  const displayTitle = getDisplayTitle(item.title);
                  const isTitleTruncated = displayTitle !== item.title.trim();

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      aria-current={isActive ? "page" : undefined}
                      onClick={() => {
                        if (!isEditing) void onSelect(item.id);
                      }}
                      onKeyDown={(event) => {
                        if (!isEditing && event.key === "Enter") {
                          void onSelect(item.id);
                        }
                      }}
                      className={clsx(
                        styles.generateForm__conversationItem,
                        isActive && styles.generateForm__conversationItemActive,
                        isPending && styles.generateForm__conversationItemPending,
                      )}
                    >
                      <Archive size={14} className={styles.generateForm__conversationIcon} />
                      <div className={styles.generateForm__conversationName}>
                        {isEditing ? (
                          <input
                            value={title}
                            autoFocus
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => setTitle(event.target.value)}
                            onKeyDown={(event) => onEditKeyDown(event, item.id)}
                            className={styles.generateForm__conversationInput}
                            aria-label={t("conversation.editName")}
                          />
                        ) : (
                          <>
                            <span className={styles.generateForm__conversationTitle}>
                              {displayTitle}
                            </span>
                            {isTitleTruncated ? (
                              <span
                                className={styles.generateForm__conversationTooltip}
                                role="tooltip"
                              >
                                {item.title}
                              </span>
                            ) : null}
                          </>
                        )}
                      </div>
                      <div className={styles.generateForm__conversationActions}>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (isEditing) {
                              void save(item.id);
                            } else {
                              startEdit(item);
                            }
                          }}
                          className={styles.generateForm__iconButton}
                          aria-label={
                            isEditing ? t("conversation.saveName") : t("conversation.editName")
                          }
                        >
                          {isEditing ? <Check size={13} /> : <Pencil size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteCandidate(item);
                          }}
                          className={clsx(
                            styles.generateForm__iconButton,
                            styles.generateForm__iconButtonDanger,
                          )}
                          aria-label={t("conversation.delete")}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <div className={styles.generateForm__emptyConversations}>{t("conversation.empty")}</div>
        )}
      </div>
      <Sheet
        open={deleteCandidate !== null}
        onClose={() => setDeleteCandidate(null)}
        title={t("conversation.deleteTitle")}
        isLocked={Boolean(pendingId)}
        footer={
          <div className={styles.generateForm__dialogActions}>
            <button
              type="button"
              className={styles.generateForm__dialogCancel}
              onClick={() => setDeleteCandidate(null)}
            >
              {t("conversation.cancel")}
            </button>
            <button
              type="button"
              className={styles.generateForm__dialogConfirm}
              onClick={confirmDelete}
            >
              {t("conversation.deleteConfirm")}
            </button>
          </div>
        }
      >
        <p className={styles.generateForm__dialogText}>
          {t("conversation.deleteDescription", { title: deleteCandidate?.title ?? "" })}
        </p>
      </Sheet>
    </aside>
  );
}
