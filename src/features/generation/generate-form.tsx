"use client";

import clsx from "clsx";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { generationConversationsApi } from "@/api/generation/conversations";
import { generationTasksApi } from "@/api/generation/tasks";
import { getErrorMessage } from "@/utils/error";
import { isSupportedImageType, maxImageBytes, maxImageFiles } from "@/utils/media";
import { ConversationSidebar } from "./conversation-sidebar";
import { GenerationSettings } from "./generation-settings";
import {
  defaultOptions,
  estimateOptionsCredits,
  getGenerationQuality,
  getGenerationSize,
  groupConversations,
  normalizeConversation,
  type ConversationItem,
  type GenerationOptions,
  type MediaInput,
  type Notice,
  type TaskItem,
} from "./generation-model";
import { PromptComposer } from "./prompt-composer";
import { TaskPreview } from "./task-preview";
import styles from "./generate-form.module.css";

type GenerateFormProps = {
  initialChats: ConversationItem[];
  initialId?: string;
  initialTasks: TaskItem[];
  initialBalance: number;
};

export function GenerateForm(props: GenerateFormProps) {
  const initialChats = props.initialChats;
  const initialId = props.initialId;
  const initialTasks = props.initialTasks;
  const initialBalance = props.initialBalance;

  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState(initialId || initialChats[0]?.id || "");
  const [tasks, setTasks] = useState(initialTasks);
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<GenerationOptions>(defaultOptions);
  const [inputs, setInputs] = useState<MediaInput[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [balance, setBalance] = useState(initialBalance);
  const [errorCost, setErrorCost] = useState<number | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);

  const size = getGenerationSize(options);
  const estimate = estimateOptionsCredits(options);
  const isCostError = balance < estimate || errorCost === estimate;
  const groups = groupConversations(chats);
  const pendingKey = tasks
    .filter(isPending)
    .map((task) => `${task.id}:${task.status}`)
    .join("|");
  const summary = `${options.resolution} · ${options.ratio} · 预计 ${estimate} 积分`;

  useEffect(() => {
    if (!activeId || !pendingKey) return;

    let disposed = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const data = await generationConversationsApi.fetchConversationTasks(activeId);
        if (disposed) return;

        setTasks(data.tasks);
        if (!data.tasks.some(isPending)) {
          await refreshList();
          return;
        }
      } catch {
        // Polling retries transient failures without replacing the current UI.
      }

      if (!disposed) timer = window.setTimeout(poll, 2500);
    }

    timer = window.setTimeout(poll, 2500);
    return () => {
      disposed = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [activeId, pendingKey]);

  async function refreshList() {
    try {
      const data = await generationConversationsApi.fetchConversations();
      setChats(data.conversations.map(normalizeConversation));
    } catch {
      // The task list is still usable when this background refresh fails.
    }
  }

  async function createChat(clearPrompt = true) {
    setNotice(null);

    try {
      const data = await generationConversationsApi.createConversation({
        title: "新对话",
      });
      const item = normalizeConversation(data.conversation);

      setChats((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
      setActiveId(item.id);
      setTasks([]);
      if (clearPrompt) setPrompt("");
      setMenuOpen(false);
      return item;
    } catch (error) {
      showError(error);
      return null;
    }
  }

  async function selectChat(id: string) {
    setActiveId(id);
    setMenuOpen(false);
    setNotice(null);

    try {
      const data = await generationConversationsApi.fetchConversationTasks(id);
      setTasks(data.tasks);
    } catch (error) {
      showError(error);
    }
  }

  async function renameChat(id: string, title: string) {
    if (!title) {
      setNotice({ text: "对话名称不能为空", tone: "error" });
      return false;
    }

    setNotice(null);
    try {
      const data = await generationConversationsApi.updateConversation(id, {
        title,
      });
      const updated = normalizeConversation(data.conversation);
      setChats((current) => current.map((item) => (item.id === id ? updated : item)));
      return true;
    } catch (error) {
      showError(error);
      return false;
    }
  }

  async function deleteChat(id: string) {
    setNotice(null);

    try {
      await generationConversationsApi.deleteConversation(id);
    } catch (error) {
      showError(error);
      return;
    }

    const remaining = chats.filter((item) => item.id !== id);
    setChats(remaining);
    if (activeId !== id) return;

    setActiveId("");
    setTasks([]);
    if (remaining[0]) {
      await selectChat(remaining[0].id);
    } else {
      await createChat();
    }
  }

  function toggleSettings() {
    setSettingsOpen((isOpen) => !isOpen);
    setMenuOpen(false);
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;

    const slots = maxImageFiles - inputs.length;
    if (slots <= 0) {
      setNotice({
        text: `最多上传 ${maxImageFiles} 张参考图`,
        tone: "error",
      });
      return;
    }

    const selected = Array.from(files).slice(0, slots);
    const invalidType = selected.find((file) => !isSupportedImageType(file.type));
    const oversized = selected.find((file) => file.size > maxImageBytes);

    if (invalidType) {
      setNotice({ text: "仅支持 PNG、JPEG 和 WebP 图片", tone: "error" });
      return;
    }
    if (oversized) {
      setNotice({ text: "单张图片不能超过 10 MB", tone: "error" });
      return;
    }

    setUploading(true);
    setNotice(null);
    try {
      const uploaded = await Promise.all(selected.map(uploadFile));
      setInputs((current) => [...current, ...uploaded].slice(0, maxImageFiles));
      setOptions((current) => ({ ...current, mode: "edit" }));
    } catch (error) {
      showError(error);
    } finally {
      setUploading(false);
    }
  }

  function removeInput(id: string) {
    setInputs((current) => current.filter((item) => item.id !== id));
  }

  async function submit() {
    const text = prompt.trim();
    if (!text) return;
    if (balance < estimate) {
      setErrorCost(estimate);
      setNotice(null);
      return;
    }
    if (options.mode === "edit" && !inputs.length) {
      setNotice({
        text: "图生图需要先上传至少 1 张参考图",
        tone: "error",
      });
      return;
    }

    setSubmitting(true);
    setNotice(null);

    let pendingId = "";

    try {
      const conversationId = activeId || (await createChat(false))?.id;
      if (!conversationId) return;

      pendingId = `pending-${Date.now()}`;
      const pendingTask: TaskItem = {
        id: pendingId,
        prompt: text,
        mode: options.mode,
        status: "running",
        size,
        imageCount: options.count,
        costCredits: estimate,
        createdAt: new Date().toISOString(),
        imageUrls: [],
      };

      setTasks((current) => [pendingTask, ...current]);
      setPrompt("");

      const data = await generationTasksApi.createTask({
        conversationId,
        prompt: text,
        mode: options.mode,
        quality: getGenerationQuality(options.quality),
        outputFormat: options.format,
        size,
        imageCount: options.count,
        inputMediaIds: options.mode === "edit" ? inputs.map((item) => item.id) : [],
      });
      const task = data.task;

      setErrorCost(null);
      setTasks((current) => current.map((item) => (item.id === pendingId ? task : item)));
      setBalance((current) => {
        const next = current - task.costCredits;
        if (next < 0) return 0;

        return next;
      });
      setChats((current) =>
        current.map((item) =>
          item.id === conversationId
            ? {
                ...item,
                title: item.title === "新对话" ? getTitle(text) : item.title,
                taskCount: item.taskCount + 1,
                latestTaskStatus: task.status,
                latestTaskCost: task.costCredits,
                lastTaskAt: task.createdAt,
              }
            : item,
        ),
      );
      await refreshList();
    } catch (error) {
      showError(error);
      setTasks((current) =>
        current.map((item) => {
          const isPendingTask = item.id === pendingId;
          if (!isPendingTask) return item;

          return {
            ...item,
            status: "failed",
          };
        }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function showError(error: unknown) {
    const message = getErrorMessage(error);
    if (message === "积分不足") {
      setErrorCost(estimate);
      setNotice(null);
      return;
    }

    setNotice({ text: message, tone: "error" });
  }

  const sidebar = (
    <ConversationSidebar
      groups={groups}
      activeId={activeId}
      summary={summary}
      onOpenSettings={toggleSettings}
      onCreate={createChat}
      onSelect={selectChat}
      onRename={renameChat}
      onDelete={deleteChat}
    />
  );
  const settingsPanel = (
    <GenerationSettings value={options} estimate={estimate} onChange={setOptions} />
  );

  return (
    <div className={styles.generateForm}>
      <div
        className={clsx(
          styles.generateForm__layout,
          isCollapsed && styles.generateForm__layoutCollapsed,
        )}
      >
        <div className={styles.generateForm__desktopSidebarSlot}>
          {isCollapsed ? (
            <div className={styles.generateForm__sidebarPlaceholder} />
          ) : (
            <div className={styles.generateForm__sidebarWrap}>{sidebar}</div>
          )}
        </div>

        <section className={styles.generateForm__workspace} onClick={() => setSettingsOpen(false)}>
          <div className={styles.generateForm__desktopToolbar}>
            {!isSettingsOpen ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setCollapsed((value) => !value);
                }}
                className={styles.generateForm__collapseButton}
                aria-label={isCollapsed ? "展开对话侧栏" : "收起对话侧栏"}
              >
                {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
            ) : null}
          </div>

          <div className={styles.generateForm__mobileMenu}>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className={styles.generateForm__mobileMenuButton}
              aria-label="打开对话列表"
            >
              <Menu size={17} />
            </button>
          </div>

          {isSettingsOpen ? (
            <div
              className={styles.generateForm__settingsDock}
              onClick={(event) => event.stopPropagation()}
            >
              {settingsPanel}
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSettingsOpen(false);
                  setCollapsed(true);
                }}
                className={clsx(
                  styles.generateForm__collapseButton,
                  styles.generateForm__settingsClose,
                )}
                aria-label="关闭生图设置"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          ) : null}

          <TaskPreview tasks={tasks} onPromptChange={setPrompt} />
          <PromptComposer
            inputs={inputs}
            prompt={prompt}
            mode={options.mode}
            estimate={estimate}
            hasCostError={isCostError}
            notice={notice}
            isBusy={isSubmitting || isUploading}
            onPromptChange={setPrompt}
            onFiles={addFiles}
            onRemove={removeInput}
            onNew={createChat}
            onSubmit={submit}
          />
        </section>
      </div>

      {isMenuOpen ? (
        <div className={styles.generateForm__mobileOverlay} onClick={() => setMenuOpen(false)}>
          <div
            className={styles.generateForm__mobilePanel}
            onClick={(event) => event.stopPropagation()}
          >
            {sidebar}
          </div>
        </div>
      ) : null}

      {isSettingsOpen ? (
        <div
          className={clsx(
            styles.generateForm__mobileOverlay,
            styles.generateForm__mobileOverlaySettings,
          )}
          onClick={() => setSettingsOpen(false)}
        >
          <div
            className={styles.generateForm__mobileSettingsPanel}
            onClick={(event) => event.stopPropagation()}
          >
            {settingsPanel}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function isPending(task: TaskItem) {
  return task.status === "queued" || task.status === "running";
}

function getTitle(prompt: string) {
  const text = prompt.replace(/\s+/g, " ").trim();
  return text.length > 24 ? `${text.slice(0, 24)}...` : text || "新对话";
}

async function uploadFile(file: File) {
  const data = new FormData();
  data.set("file", file);
  return (await generationTasksApi.uploadMedia(data)).media;
}
