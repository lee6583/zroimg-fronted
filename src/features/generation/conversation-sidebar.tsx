"use client";

import clsx from "clsx";
import { Archive, Check, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useState } from "react";
import type { ConversationGroup, ConversationItem } from "./generation-model";
import styles from "./generate-form.module.css";

type ConversationSidebarProps = {
  groups: ConversationGroup[];
  activeId: string;
  summary: string;
  onOpenSettings: () => void;
  onCreate: () => Promise<unknown>;
  onSelect: (id: string) => Promise<void>;
  onRename: (id: string, title: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
};

export function ConversationSidebar({
  groups,
  activeId,
  summary,
  onOpenSettings,
  onCreate,
  onSelect,
  onRename,
  onDelete,
}: ConversationSidebarProps) {
  const [editId, setEditId] = useState("");
  const [title, setTitle] = useState("");
  const [pendingId, setPendingId] = useState("");

  function startEdit(item: ConversationItem) {
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
            <span className={styles.generateForm__settingsTitle}>生图设置</span>
            <span className={styles.generateForm__settingsMeta}>{summary}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => void onCreate()}
          className={styles.generateForm__newConversationButton}
        >
          <Plus size={15} />
          新建对话
        </button>
      </div>

      <div className={styles.generateForm__conversationScroll}>
        {groups.length ? (
          groups.map((group) => (
            <section key={group.key} className={styles.generateForm__conversationGroup}>
              <p className={styles.generateForm__conversationDate}>{group.label}</p>
              <div className={styles.generateForm__conversationList}>
                {group.items.map((item) => {
                  const isActive = item.id === activeId;
                  const isEditing = item.id === editId;
                  const isPending = item.id === pendingId;

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
                            aria-label="编辑对话名称"
                          />
                        ) : (
                          <span className={styles.generateForm__conversationTitle}>
                            {item.title}
                          </span>
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
                          aria-label={isEditing ? "保存对话名称" : "编辑对话名称"}
                        >
                          {isEditing ? <Check size={13} /> : <Pencil size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void remove(item.id);
                          }}
                          className={clsx(
                            styles.generateForm__iconButton,
                            styles.generateForm__iconButtonDanger,
                          )}
                          aria-label="删除对话"
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
          <div className={styles.generateForm__emptyConversations}>还没有对话</div>
        )}
      </div>
    </aside>
  );
}
