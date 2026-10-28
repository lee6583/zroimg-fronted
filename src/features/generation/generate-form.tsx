"use client";

import clsx from "clsx";
import { Menu, MessageSquarePlus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { generationConversationsApi } from "@/api/generation/conversations";
import { generationTasksApi } from "@/api/generation/tasks";
import { uploadMediaFile } from "@/api/media/uploads";
import { Sheet } from "@/components/ui/sheet";
import { usePromptPolish } from "@/features/polish/use-prompt-polish";
import { translateApiError } from "@/i18n/api-error";
import { getImageResolutionLabel } from "@/utils/generation-quality";
import { isSupportedImageType, maxImageBytes } from "@/utils/media";
import type { FavoriteCollection } from "@/types/favorites";
import type {
  GenerationConversation,
  GenerationModel,
  GenerationTask,
  MediaAsset,
} from "@/types/generation";
import { ConversationSidebar } from "./conversation-sidebar";
import { GenerationSettings } from "./generation-settings";
import {
  activeConversationCookieName,
  groupConversations,
  isTaskPending,
  normalizeOptions,
  resolveActiveConversationId,
  supportsMode,
  type GenerationOptions,
  type Notice,
} from "./generation-model";
import { PromptComposer } from "./prompt-composer";
import { TaskPreview } from "./task-preview";
import { useCompactLayout } from "./use-compact-layout";
import styles from "./generate-form.module.css";

type GenerateFormProps = {
  initialChats: GenerationConversation[];
  initialId?: string;
  initialTasks: GenerationTask[];
  initialBalance: number;
  initialOptions: GenerationOptions;
  initialEstimate: number;
  initialCollections: FavoriteCollection[];
  modelOptions: GenerationModel[];
  // 从画廊「用这个提示词创作」带过来的提示词（/generate?prompt=...）
  initialPrompt?: string;
};

const maxGenerationInputs = 1;
// Java 积分不足时返回的固定 message（尚无 errorCode），只用于判断，不直接展示。
const insufficientPointsMessage = "积分不足";

export function GenerateForm(props: GenerateFormProps) {
  const initialChats = props.initialChats;
  const initialId = props.initialId;
  const initialTasks = props.initialTasks;
  const initialBalance = props.initialBalance;
  const initialOptions = props.initialOptions;
  const initialEstimate = props.initialEstimate;
  const initialCollections = props.initialCollections;
  const modelOptions = props.modelOptions;
  const initialPrompt = props.initialPrompt ?? "";
  const t = useTranslations("generate");
  const tTask = useTranslations("task");
  const tError = useTranslations("errors.api");
  const isCompact = useCompactLayout();
  const defaultTitle = t("conversation.defaultTitle");

  // Restore unsent draft from sessionStorage (URL-supplied prompt takes precedence).
  const DRAFT_KEY = "generate:draft";
  const draft = (() => {
    if (typeof window === "undefined" || props.initialPrompt) return null;
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as { prompt: string; options: GenerationOptions }) : null;
    } catch {
      return null;
    }
  })();

  const [chats, setChats] = useState(initialChats);
  const [activeId, setActiveId] = useState(initialId || initialChats[0]?.id || "");
  const [tasks, setTasks] = useState(initialTasks);
  const [prompt, setPrompt] = useState(draft?.prompt ?? initialPrompt);
  const [options, setOptions] = useState<GenerationOptions>(draft?.options ?? initialOptions);
  const [estimate, setEstimate] = useState(initialEstimate);
  const [hasEstimateError, setEstimateError] = useState(false);
  const [inputs, setInputs] = useState<MediaAsset[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [balance, setBalance] = useState(initialBalance);
  const [errorCost, setErrorCost] = useState<number | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isEstimating, setEstimating] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [isCreatingChat, setCreatingChat] = useState(false);
  const isCreatingChatRef = useRef(false);
  const selectionVersionRef = useRef(0);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const polish = usePromptPolish({
    scene: "image",
    prompt,
    // 与提交任务时一致：图生图只使用第一张上传的参考图
    referenceMediaIds: options.mode === "text_to_image" ? [] : [inputs[0]?.id],
    textareaRef: promptRef,
    onApply: setPrompt,
    onNotice: (text) => setNotice({ text, tone: "error" }),
    onBalance: setBalance,
  });

  const isCostError = !isEstimating && (balance < estimate || errorCost === estimate);
  const groups = groupConversations(chats);
  const pendingKey = tasks
    .filter(isTaskPending)
    .map((task) => `${task.id}:${task.status}`)
    .join("|");
  const summary = t("settings.summary", { ratio: options.ratio, points: estimate });
  const activeModel = modelOptions.find((item) => item.modelCode === options.modelCode);
  const compactSummary = t("settings.compactSummary", {
    model: activeModel?.modelName ?? options.modelCode,
    ratio: options.ratio,
    quality: getImageResolutionLabel(options.quality, tTask),
    count: options.count,
  });
  const activeTitle = chats.find((item) => item.id === activeId)?.title || defaultTitle;

  useEffect(() => {
    let disposed = false;
    const selectionVersion = selectionVersionRef.current;

    async function restoreConversation() {
      const rememberedId = readActiveConversationId();
      let nextChats = initialChats;

      try {
        if (rememberedId && !nextChats.some((item) => item.id === rememberedId)) {
          nextChats = await generationConversationsApi.fetchConversations();
        }

        const nextId = resolveActiveConversationId(nextChats, rememberedId, initialId);
        let nextTasks: GenerationTask[] = [];
        if (nextId) {
          nextTasks = await generationConversationsApi.fetchConversationTasks(nextId);
        }

        if (disposed || selectionVersionRef.current !== selectionVersion) return;

        setChats(nextChats);
        setActiveId(nextId);
        setTasks(nextTasks);
        if (nextId) rememberActiveConversation(nextId);
      } catch {
        // Keep the server-rendered conversation available when background restoration fails.
      }
    }

    void restoreConversation();
    return () => {
      disposed = true;
    };
  }, [initialChats, initialId]);

  useEffect(() => {
    let isCurrent = true;

    const timer = window.setTimeout(async () => {
      try {
        const price = await generationTasksApi.estimatePrice({
          modelCode: options.modelCode,
          mode: options.mode,
          ratio: options.ratio,
          quality: options.quality,
          count: options.count,
        });
        if (!isCurrent) {
          return;
        }

        setEstimate(price.requiredPoints);
        setBalance(price.currentPoints);
        setErrorCost(null);
        setEstimateError(false);
      } catch (error) {
        if (isCurrent) {
          setEstimateError(true);
          setNotice({ text: translateApiError(error, tError), tone: "error" });
        }
      } finally {
        if (isCurrent) {
          setEstimating(false);
        }
      }
    }, 200);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [options.count, options.mode, options.modelCode, options.quality, options.ratio, tError]);

  useEffect(() => {
    if (!activeId || !pendingKey) return;

    let disposed = false;
    let timer: number | undefined;

    async function poll() {
      try {
        const nextTasks = await generationConversationsApi.fetchConversationTasks(activeId);
        if (disposed) return;

        setTasks(nextTasks);
        if (!nextTasks.some(isTaskPending)) {
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
      setChats(await generationConversationsApi.fetchConversations());
    } catch {
      // The task list is still usable when this background refresh fails.
    }
  }

  async function createChat(clearPrompt = true) {
    if (isCreatingChatRef.current) return null;

    const activeChat = chats.find((item) => item.id === activeId);
    if (activeChat && isReusableDraftChat(activeChat, tasks)) {
      selectionVersionRef.current += 1;
      setActiveId(activeChat.id);
      rememberActiveConversation(activeChat.id);
      setTasks([]);
      if (clearPrompt) setPrompt("");
      setMenuOpen(false);
      setNotice(null);
      return activeChat;
    }

    isCreatingChatRef.current = true;
    setCreatingChat(true);
    setNotice(null);

    try {
      const item = await generationConversationsApi.createConversation({
        title: defaultTitle,
      });

      selectionVersionRef.current += 1;
      setChats((current) => [item, ...current.filter((entry) => entry.id !== item.id)]);
      setActiveId(item.id);
      rememberActiveConversation(item.id);
      setTasks([]);
      if (clearPrompt) setPrompt("");
      setMenuOpen(false);
      return item;
    } catch (error) {
      showError(error);
      return null;
    } finally {
      isCreatingChatRef.current = false;
      setCreatingChat(false);
    }
  }

  // Save draft so the user can navigate away and come back without losing their work.
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ prompt, options }));
    } catch {
      // Ignore if storage is full or blocked.
    }
  }, [prompt, options]);

  async function selectChat(id: string) {
    selectionVersionRef.current += 1;
    setActiveId(id);
    rememberActiveConversation(id);
    setMenuOpen(false);
    setNotice(null);

    try {
      setTasks(await generationConversationsApi.fetchConversationTasks(id));
    } catch (error) {
      showError(error);
    }
  }

  async function renameChat(id: string, title: string) {
    if (!title) {
      setNotice({ text: t("conversation.nameRequired"), tone: "error" });
      return false;
    }

    setNotice(null);
    try {
      const updated = await generationConversationsApi.updateConversation(id, {
        title,
      });
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

    selectionVersionRef.current += 1;
    setActiveId("");
    setTasks([]);
    if (remaining[0]) {
      await selectChat(remaining[0].id);
    }
  }

  function toggleSettings() {
    setSettingsOpen((isOpen) => !isOpen);
    setMenuOpen(false);
  }

  function openSettings() {
    setSettingsOpen(true);
    setMenuOpen(false);
  }

  function changeOptions(nextOptions: GenerationOptions) {
    setEstimating(true);
    setEstimateError(false);
    setOptions(nextOptions);
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;

    const supportsEdit = modelOptions.some((model) => supportsMode(model, "image_to_image"));
    if (!supportsEdit) {
      setNotice({ text: t("errors.noEditModel"), tone: "error" });
      return;
    }

    const slots = maxGenerationInputs - inputs.length;
    if (slots <= 0) {
      setNotice({
        text: t("errors.maxInputs", { count: maxGenerationInputs }),
        tone: "error",
      });
      return;
    }

    const selected = Array.from(files).slice(0, slots);
    const invalidType = selected.find((file) => !isSupportedImageType(file.type));
    const oversized = selected.find((file) => file.size > maxImageBytes);

    if (invalidType) {
      setNotice({ text: t("errors.fileType"), tone: "error" });
      return;
    }
    if (oversized) {
      setNotice({ text: t("errors.fileSize"), tone: "error" });
      return;
    }

    setUploading(true);
    setNotice(null);
    try {
      const uploaded = await Promise.all(selected.map(uploadMediaFile));
      setInputs((current) => [...current, ...uploaded].slice(0, maxGenerationInputs));
      // Mode might not change (already image_to_image) so don't set isEstimating manually here;
      // the estimate effect triggers automatically when options actually change.
      setOptions((current) => {
        const nextOptions = { ...current, mode: "image_to_image" as const };
        return normalizeOptions(nextOptions, modelOptions);
      });
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
    if (isEstimating || hasEstimateError) return;
    if (balance < estimate) {
      setErrorCost(estimate);
      setNotice(null);
      return;
    }
    if (options.mode === "image_to_image" && !inputs.length) {
      setNotice({
        text: t("errors.needReference"),
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
      const pendingTask = createPendingTask(pendingId, text, options, estimate);

      setTasks((current) => [pendingTask, ...current]);
      setPrompt("");
      // Clear draft after successful submission so the next session starts fresh.
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }

      let referenceMediaId: string | undefined;
      if (options.mode === "image_to_image") {
        referenceMediaId = inputs[0]?.id;
      }

      const task = await generationTasksApi.createTask({
        conversationId,
        modelCode: options.modelCode,
        prompt: text,
        mode: options.mode,
        referenceMediaId,
        quality: options.quality,
        ratio: options.ratio,
        count: options.count,
      });
      const latestTask = { status: task.status, costCredits: task.requiredPoints };

      setErrorCost(null);
      setTasks((current) => current.map((item) => (item.id === pendingId ? task : item)));
      setBalance((current) => {
        const next = current - task.requiredPoints;
        if (next < 0) return 0;

        return next;
      });
      setChats((current) =>
        current.map((item) => {
          if (item.id !== conversationId) return item;

          let title = item.title;
          if (title === defaultTitle) title = getTitle(text) || defaultTitle;

          return {
            ...item,
            title,
            count: { tasks: item.count.tasks + 1 },
            tasks: [latestTask],
            lastTaskAt: task.createTime,
          };
        }),
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
            status: "failed" as const,
          };
        }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  function showError(error: unknown) {
    if (error instanceof Error && error.message === insufficientPointsMessage) {
      setErrorCost(estimate);
      setNotice(null);
      return;
    }

    setNotice({ text: translateApiError(error, tError), tone: "error" });
  }

  const sidebar = (
    <ConversationSidebar
      groups={groups}
      activeId={activeId}
      summary={summary}
      isCreating={isCreatingChat}
      onOpenSettings={isCompact ? openSettings : toggleSettings}
      onCreate={createChat}
      onSelect={selectChat}
      onRename={renameChat}
      onDelete={deleteChat}
    />
  );
  const settingsPanel = (
    <GenerationSettings
      value={options}
      estimate={estimate}
      isEstimating={isEstimating}
      modelOptions={modelOptions}
      onChange={changeOptions}
    />
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

        <section
          className={styles.generateForm__workspace}
          onClick={() => {
            if (!isCompact) setSettingsOpen(false);
          }}
        >
          <div className={styles.generateForm__desktopToolbar}>
            {!isSettingsOpen ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setCollapsed((value) => !value);
                }}
                className={styles.generateForm__collapseButton}
                aria-label={
                  isCollapsed ? t("workspace.expandSidebar") : t("workspace.collapseSidebar")
                }
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
              aria-label={t("workspace.openConversations")}
              title={t("workspace.openConversations")}
            >
              <Menu size={18} />
            </button>
            <span className={styles.generateForm__mobileTitle} title={activeTitle}>
              {activeTitle}
            </span>
            <button
              type="button"
              onClick={() => void createChat()}
              disabled={isCreatingChat || isSubmitting}
              className={styles.generateForm__mobileMenuButton}
              aria-label={t("conversation.create")}
              title={t("conversation.create")}
            >
              <MessageSquarePlus size={18} />
            </button>
          </div>

          {isSettingsOpen && !isCompact ? (
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
                aria-label={t("workspace.closeSettings")}
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          ) : null}

          <TaskPreview tasks={tasks} collections={initialCollections} onPromptChange={setPrompt} />
          <PromptComposer
            inputs={inputs}
            prompt={prompt}
            mode={options.mode}
            estimate={estimate}
            hasCostError={isCostError}
            notice={notice}
            isBusy={isSubmitting || isUploading || isEstimating}
            isBlocked={hasEstimateError}
            isCreating={isCreatingChat}
            settingsSummary={compactSummary}
            onOpenSettings={openSettings}
            onPromptChange={setPrompt}
            onFiles={addFiles}
            onRemove={removeInput}
            onNew={createChat}
            onSubmit={submit}
            polish={polish}
            textarea={promptRef}
          />
        </section>
      </div>

      <Sheet
        open={isCompact && isMenuOpen}
        onClose={() => setMenuOpen(false)}
        title={t("conversation.listTitle")}
        desktop="drawer"
        className={styles.generateForm__conversationSheet}
      >
        {sidebar}
      </Sheet>

      <Sheet
        open={isCompact && isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        title={t("settings.title")}
        className={styles.generateForm__settingsSheet}
        footer={
          <button
            type="button"
            className={styles.generateForm__sheetDone}
            onClick={() => setSettingsOpen(false)}
          >
            {t("settings.done")}
          </button>
        }
      >
        {settingsPanel}
      </Sheet>
    </div>
  );
}

function getTitle(prompt: string) {
  const text = prompt.replace(/\s+/g, " ").trim();
  return text.length > 24 ? `${text.slice(0, 24)}...` : text;
}

function isReusableDraftChat(chat: GenerationConversation, tasks: GenerationTask[]) {
  return chat.count.tasks === 0 && !chat.lastTaskAt && tasks.length === 0;
}

function createPendingTask(
  id: string,
  prompt: string,
  options: GenerationOptions,
  estimate: number,
): GenerationTask {
  return {
    id,
    taskNo: id,
    modelCode: options.modelCode,
    modelName: null,
    provider: null,
    userEmail: null,
    username: null,
    modelType: "image",
    mode: options.mode,
    prompt,
    referenceImageUrl: null,
    referenceMediaId: null,
    maskMediaId: null,
    canvasId: null,
    ratio: options.ratio,
    resolution: null,
    quality: options.quality,
    format: null,
    count: options.count,
    durationSeconds: null,
    audio: null,
    priceVersion: null,
    unitPoints: null,
    billingUnit: null,
    referencePoints: null,
    requiredPoints: estimate,
    status: "processing",
    failReason: null,
    results: [],
    createTime: new Date().toISOString(),
    updateTime: null,
    finishTime: null,
  };
}

function readActiveConversationId() {
  const prefix = `${activeConversationCookieName}=`;
  const cookie = document.cookie.split(";").find((item) => item.trim().startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.trim().slice(prefix.length)) : "";
}

function rememberActiveConversation(id: string) {
  const secure = window.location.protocol === "https:" ? ";secure" : "";
  document.cookie = `${activeConversationCookieName}=${encodeURIComponent(id)};path=/generate;max-age=31536000;samesite=lax${secure}`;
}
