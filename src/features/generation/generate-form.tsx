"use client";

import Image from "next/image";
import {
  Archive,
  ArrowUp,
  Check,
  ImagePlus,
  Menu,
  MessageSquarePlus,
  PanelLeftClose,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import { generationConversationsApi } from "@/api/generation/conversations";
import { generationTasksApi } from "@/api/generation/tasks";
import { AppSelect } from "@/components/ui/app-select";
import type {
  GenerationConversationApiItem,
  UploadedMediaApiItem,
} from "@/types/generation";
import {
  getLocalGenerationProvider,
  hasUsableLocalGenerationProvider,
  listLocalGenerationTasks,
  runLocalImageGeneration,
  saveLocalGenerationTask,
  type LocalGenerationProviderConfig,
} from "@/utils/local-generation";
import styles from "./generate-form.module.css";

type UploadedMedia = {
  id: string;
  fileName: string | null;
  kind: "input" | "output";
  file?: File;
};

type ConversationItem = {
  id: string;
  title: string;
  taskCount: number;
  latestTaskStatus: string | null;
  latestTaskCost: number | null;
  lastTaskAt: string | null;
  updatedAt: string;
  createdAt: string;
};

type TaskItem = {
  id: string;
  prompt: string;
  mode: "text" | "edit";
  status: string;
  size: string;
  imageCount: number;
  costCredits: number;
  createdAt: string;
  source?: "platform" | "local";
  imageUrls?: string[];
};

type Mode = "text" | "edit";
type QualityChoice = "auto" | "low" | "medium" | "high";
type OutputFormat = "webp" | "png" | "jpeg";
type Ratio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";
type Resolution = "1K" | "2K" | "4K";

const modelOptions = [
  { value: "gpt-image-2", label: "gpt-image-2", textBase: 10, imageBase: 15 },
];
const ratios: Ratio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const resolutions: Resolution[] = ["1K", "2K", "4K"];
const qualities: Array<{ value: QualityChoice; label: string }> = [
  { value: "auto", label: "自动" },
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
];
const outputFormats: Array<{ value: OutputFormat; label: string }> = [
  { value: "webp", label: "WebP" },
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
];
const imageCounts = [1, 2, 4];
const suggestions = [
  "一只在星空下弹吉他的猫",
  "未来城市的日落景色",
  "水彩风格的樱花园",
];
const statusLabels: Record<string, string> = {
  queued: "排队中",
  running: "生成中",
  succeeded: "已完成",
  failed: "失败",
};
const defaultLocalProvider: LocalGenerationProviderConfig = {
  enabled: false,
  baseUrl: "https://api.openai.com/v1",
  apiKey: "",
  updatedAt: null,
};

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const sizeMap: Record<Resolution, Record<Ratio, string>> = {
  "1K": {
    "1:1": "1024x1024",
    "16:9": "1360x768",
    "9:16": "768x1360",
    "4:3": "1152x864",
    "3:4": "864x1152",
  },
  "2K": {
    "1:1": "1536x1536",
    "16:9": "2048x1152",
    "9:16": "1152x2048",
    "4:3": "1792x1344",
    "3:4": "1344x1792",
  },
  "4K": {
    "1:1": "2048x2048",
    "16:9": "3840x2160",
    "9:16": "1216x2160",
    "4:3": "2816x2112",
    "3:4": "1584x2112",
  },
};

function effectiveQuality(quality: QualityChoice) {
  return quality === "auto" ? "medium" : quality;
}

function calculateCost(input: {
  mode: Mode;
  quality: QualityChoice;
  size: string;
  imageCount: number;
}) {
  const [width, height] = input.size.split("x").map(Number);
  const pixels =
    Number.isFinite(width) && Number.isFinite(height)
      ? width * height
      : 1024 * 1024;
  const modeBase = input.mode === "edit" ? 15 : 10;
  const normalizedQuality = effectiveQuality(input.quality);
  const qualityMultiplier =
    normalizedQuality === "high" ? 2 : normalizedQuality === "medium" ? 1.5 : 1;
  const sizeMultiplier =
    pixels <= 1_100_000
      ? 1
      : pixels <= 1_600_000
        ? 1.5
        : pixels <= 3_000_000
          ? 2
          : 3;
  return Math.ceil(
    modeBase * qualityMultiplier * sizeMultiplier * input.imageCount,
  );
}

function titleFromPrompt(prompt: string) {
  const normalized = prompt.replace(/\s+/g, " ").trim();
  if (!normalized) return "新对话";
  return normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized;
}

function conversationTime(conversation: ConversationItem) {
  return (
    conversation.lastTaskAt || conversation.updatedAt || conversation.createdAt
  );
}

function formatConversationDate(value: string) {
  const [date] = value.split("T");
  const [year, month, day] = date.split("-");
  if (!year || !month || !day) return "未归档";
  return `${year}/${Number(month)}/${Number(day)}`;
}

function groupConversationsByDate(conversations: ConversationItem[]) {
  const groups: Array<{
    key: string;
    label: string;
    items: ConversationItem[];
  }> = [];
  for (const conversation of conversations) {
    const value = conversationTime(conversation);
    const key = value.split("T")[0] || "unknown";
    const latestGroup = groups[groups.length - 1];
    if (latestGroup?.key === key) {
      latestGroup.items.push(conversation);
    } else {
      groups.push({
        key,
        label: key === "unknown" ? "未归档" : formatConversationDate(value),
        items: [conversation],
      });
    }
  }
  return groups;
}

function normalizeConversation(
  raw: GenerationConversationApiItem,
): ConversationItem {
  const latestTask = raw.tasks?.[0];
  return {
    id: raw.id,
    title: raw.title,
    taskCount: raw.taskCount ?? raw._count?.tasks ?? 0,
    latestTaskStatus: raw.latestTaskStatus ?? latestTask?.status ?? null,
    latestTaskCost: raw.latestTaskCost ?? latestTask?.costCredits ?? null,
    lastTaskAt: raw.lastTaskAt ?? null,
    updatedAt: raw.updatedAt,
    createdAt: raw.createdAt,
  };
}

async function uploadFile(file: File) {
  const form = new FormData();
  form.set("file", file);
  form.set("kind", "input");
  try {
    const data = await generationTasksApi.uploadMedia(form);
    return { ...(data.media as UploadedMediaApiItem), file };
  } catch {
    return null;
  }
}

function createLocalInput(file: File): UploadedMedia {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${file.name}`;
  return {
    id: `local-${id}`,
    fileName: file.name,
    kind: "input",
    file,
  };
}

function createLocalTaskId() {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}`;
  return `local-task-${id}`;
}

function CompactOption({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        styles.generateForm__compactOption,
        active && styles.generateForm__compactOptionActive,
      )}
    >
      {children}
    </button>
  );
}

function SettingGroup({
  title,
  children,
  hint,
}: {
  title: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <section className={styles.generateForm__settingGroup}>
      <h2 className={styles.generateForm__settingTitle}>{title}</h2>
      <div className={styles.generateForm__settingContent}>{children}</div>
      {hint ? <p className={styles.generateForm__settingHint}>{hint}</p> : null}
    </section>
  );
}

export function GenerateForm({
  initialConversations,
  initialConversationId,
  initialTasks,
}: {
  initialConversations: ConversationItem[];
  initialConversationId?: string;
  initialTasks: TaskItem[];
}) {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState(
    initialConversationId || initialConversations[0]?.id || "",
  );
  const [tasks, setTasks] = useState(initialTasks);
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<Mode>("text");
  const [model, setModel] = useState("gpt-image-2");
  const [ratio, setRatio] = useState<Ratio>("1:1");
  const [resolution, setResolution] = useState<Resolution>("1K");
  const [quality, setQuality] = useState<QualityChoice>("auto");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [imageCount, setImageCount] = useState(1);
  const [inputs, setInputs] = useState<UploadedMedia[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [conversationPanelOpen, setConversationPanelOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingConversationId, setEditingConversationId] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [pendingConversationId, setPendingConversationId] = useState("");
  const [localProvider, setLocalProvider] =
    useState<LocalGenerationProviderConfig>(defaultLocalProvider);

  const selectedModel =
    modelOptions.find((item) => item.value === model) ?? modelOptions[0];
  const size = sizeMap[resolution][ratio];
  const cost = calculateCost({ mode, quality, size, imageCount });
  const localProviderEnabled = hasUsableLocalGenerationProvider(localProvider);
  const conversationGroups = groupConversationsByDate(conversations);
  const layoutClassName = classNames(
    styles.generateForm__layout,
    sidebarCollapsed && styles.generateForm__layoutCollapsed,
  );
  const pendingTaskSignature = tasks
    .filter((task) => task.source !== "local")
    .filter((task) => task.status === "queued" || task.status === "running")
    .map((task) => `${task.id}:${task.status}`)
    .join("|");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLocalProvider(getLocalGenerationProvider());
    }, 0);

    listLocalGenerationTasks(3)
      .then((localTasks) => {
        const nextTasks: TaskItem[] = localTasks.map((task) => ({
          id: task.id,
          prompt: task.prompt,
          mode: task.mode,
          status: "succeeded",
          size: task.size,
          imageCount: task.imageCount,
          costCredits: 0,
          createdAt: task.createdAt,
          source: "local",
          imageUrls: task.imageUrls,
        }));
        setTasks((current) => [...nextTasks, ...current]);
      })
      .catch(() => undefined);

    function syncLocalProvider() {
      setLocalProvider(getLocalGenerationProvider());
    }

    window.addEventListener("storage", syncLocalProvider);
    window.addEventListener("focus", syncLocalProvider);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", syncLocalProvider);
      window.removeEventListener("focus", syncLocalProvider);
    };
  }, []);

  useEffect(() => {
    if (!activeConversationId || !pendingTaskSignature) return;

    const timer = window.setInterval(async () => {
      try {
        const data =
          await generationConversationsApi.fetchConversationTasks(
            activeConversationId,
          );
        const nextTasks = Array.isArray(data) ? data : (data.tasks ?? []);
        setTasks(nextTasks as TaskItem[]);

        const stillPending = nextTasks.some(
          (task) => task.status === "queued" || task.status === "running",
        );
        if (stillPending) return;

        const conversationsData =
          await generationConversationsApi.fetchConversations();
        const nextConversations = Array.isArray(conversationsData)
          ? conversationsData
          : (conversationsData.conversations ?? []);
        setConversations(nextConversations.map(normalizeConversation));
      } catch {
        return;
      }
    }, 2500);

    return () => window.clearInterval(timer);
  }, [activeConversationId, pendingTaskSignature]);

  function toggleSettings() {
    setSettingsOpen((current) => !current);
  }

  async function refreshConversations() {
    try {
      const data = await generationConversationsApi.fetchConversations();
      const nextConversations = Array.isArray(data)
        ? data
        : (data.conversations ?? []);
      setConversations(nextConversations.map(normalizeConversation));
    } catch {
      return;
    }
  }

  async function createConversation() {
    setMessage("");
    try {
      const data = await generationConversationsApi.createConversation({
        title: "新对话",
      });
      if (!data.conversation) {
        setMessage("新建对话失败");
        return null;
      }

      const conversation = normalizeConversation(data.conversation);
      setConversations((current) => [
        conversation,
        ...current.filter((item) => item.id !== conversation.id),
      ]);
      setActiveConversationId(conversation.id);
      setTasks([]);
      setPrompt("");
      setConversationPanelOpen(false);
      return conversation;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "新建对话失败");
      return null;
    }
  }

  async function selectConversation(id: string) {
    setActiveConversationId(id);
    setConversationPanelOpen(false);
    setMessage("");
    setEditingConversationId("");
    try {
      const data = await generationConversationsApi.fetchConversationTasks(id);
      setTasks((Array.isArray(data) ? data : (data.tasks ?? [])) as TaskItem[]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "加载对话失败");
    }
  }

  function startEditingConversation(conversation: ConversationItem) {
    setEditingConversationId(conversation.id);
    setEditingTitle(conversation.title);
    setMessage("");
  }

  async function renameConversation(id: string) {
    const title = editingTitle.trim();
    if (!title) {
      setMessage("对话名称不能为空");
      return;
    }

    setPendingConversationId(id);
    setMessage("");
    try {
      const data = await generationConversationsApi.updateConversation(id, {
        title,
      });
      setPendingConversationId("");
      if (!data.conversation) {
        setMessage("修改对话名称失败");
        return;
      }

      const conversation = normalizeConversation(data.conversation);
      setConversations((current) =>
        current.map((item) => (item.id === id ? conversation : item)),
      );
      setEditingConversationId("");
      setEditingTitle("");
    } catch (error) {
      setPendingConversationId("");
      setMessage(error instanceof Error ? error.message : "修改对话名称失败");
      return;
    }
  }

  async function deleteConversation(id: string) {
    setPendingConversationId(id);
    setMessage("");
    try {
      await generationConversationsApi.deleteConversation(id);
      setPendingConversationId("");
    } catch (error) {
      setPendingConversationId("");
      setMessage(error instanceof Error ? error.message : "删除对话失败");
      return;
    }

    const remaining = conversations.filter((item) => item.id !== id);
    setConversations(remaining);

    if (editingConversationId === id) {
      setEditingConversationId("");
      setEditingTitle("");
    }

    if (activeConversationId !== id) return;

    if (remaining[0]) {
      await selectConversation(remaining[0].id);
    } else {
      await createConversation();
    }
  }

  function handleEditingTitleKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    id: string,
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      void renameConversation(id);
    }
    if (event.key === "Escape") {
      setEditingConversationId("");
      setEditingTitle("");
    }
  }

  async function onInputFiles(files: FileList | null) {
    if (!files) return;
    setMessage("");

    const next = [...inputs];
    for (const file of Array.from(files).slice(0, 4 - next.length)) {
      if (localProviderEnabled) {
        next.push(createLocalInput(file));
        continue;
      }

      const media = await uploadFile(file);
      if (!media) {
        setMessage("上传失败");
        return;
      }
      next.push(media);
    }

    setInputs(next);
    setMode("edit");
  }

  function removeInput(id: string) {
    setInputs(inputs.filter((item) => item.id !== id));
  }

  async function submitLocalGeneration() {
    if (mode === "edit") {
      const missingLocalFiles = inputs.some((item) => !item.file);
      if (missingLocalFiles) {
        setMessage("本地自定义接口需要重新选择本地参考图");
        return;
      }
    }

    setLoading(true);
    setMessage("");

    const taskId = createLocalTaskId();
    const createdAt = new Date().toISOString();
    const nextTask: TaskItem = {
      id: taskId,
      prompt: prompt.trim(),
      mode,
      status: "running",
      size,
      imageCount,
      costCredits: 0,
      createdAt,
      source: "local",
      imageUrls: [],
    };

    setTasks((current) => [nextTask, ...current]);

    try {
      const imageUrls = await runLocalImageGeneration({
        id: taskId,
        provider: localProvider,
        prompt: prompt.trim(),
        mode,
        model,
        size,
        quality: effectiveQuality(quality),
        outputFormat,
        imageCount,
        inputFiles: inputs
          .map((item) => item.file)
          .filter((file): file is File => Boolean(file)),
      });

      await saveLocalGenerationTask({
        id: taskId,
        prompt: prompt.trim(),
        mode,
        model,
        size,
        quality: effectiveQuality(quality),
        outputFormat,
        imageCount,
        imageUrls,
        createdAt,
      });

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status: "succeeded",
                imageUrls,
              }
            : task,
        ),
      );
      setPrompt("");
      setMessage(
        "已使用本地自定义接口生成，不扣平台积分，图片已保存到当前浏览器 IndexedDB",
      );
    } catch (error) {
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, status: "failed" } : task,
        ),
      );
      setMessage(
        error instanceof Error ? error.message : "本地自定义接口生成失败",
      );
    }

    setLoading(false);
  }

  async function submit() {
    if (!prompt.trim()) return;
    if (mode === "edit" && inputs.length === 0) {
      setMessage("图生图需要先上传至少 1 张参考图");
      return;
    }

    if (localProviderEnabled) {
      await submitLocalGeneration();
      return;
    }

    if (
      mode === "edit" &&
      inputs.some((item) => item.id.startsWith("local-"))
    ) {
      setMessage("切回平台模式后，需要重新上传参考图");
      return;
    }

    setLoading(true);
    setMessage("");
    const conversationId =
      activeConversationId || (await createConversation())?.id;
    if (!conversationId) {
      setLoading(false);
      return;
    }

    const data = await generationTasksApi
      .createTask({
        conversationId,
        prompt: prompt.trim(),
        mode,
        quality: effectiveQuality(quality),
        outputFormat,
        size,
        imageCount,
        inputMediaIds: mode === "edit" ? inputs.map((item) => item.id) : [],
      })
      .catch((error) => {
        setLoading(false);
        setMessage(error instanceof Error ? error.message : "创建任务失败");
        return null;
      });

    setLoading(false);

    if (!data?.task) {
      return;
    }

    const nextTask: TaskItem = {
      id: data.task.id,
      prompt: data.task.prompt,
      mode: data.task.mode,
      status: data.task.status,
      size: data.task.size,
      imageCount: data.task.imageCount,
      costCredits: data.task.costCredits,
      createdAt: data.task.createdAt,
    };
    setTasks((current) => [nextTask, ...current]);
    setConversations((current) =>
      current.map((item) =>
        item.id === conversationId
          ? {
              ...item,
              title:
                item.title === "新对话" ? titleFromPrompt(prompt) : item.title,
              taskCount: item.taskCount + 1,
              latestTaskStatus: nextTask.status,
              latestTaskCost: nextTask.costCredits,
              lastTaskAt: nextTask.createdAt,
            }
          : item,
      ),
    );
    setPrompt("");
    setMessage(`任务已提交，预计消耗 ${data.task.costCredits} 积分`);
    await refreshConversations();
  }

  const conversationList = (
    <aside className={styles.generateForm__sidebar}>
      <div className={styles.generateForm__sidebarHeader}>
        <button
          type="button"
          onClick={toggleSettings}
          className={styles.generateForm__settingsTrigger}
        >
          <span className={styles.generateForm__settingsIcon}>
            <Settings size={15} />
          </span>
          <span className={styles.generateForm__settingsCopy}>
            <span className={styles.generateForm__settingsTitle}>生图设置</span>
            <span className={styles.generateForm__settingsMeta}>
              {localProviderEnabled
                ? "本地自定义 · 不扣积分"
                : `${resolution} · ${ratio} · 预计 ${cost} 积分`}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={createConversation}
          className={styles.generateForm__newConversationButton}
        >
          <Plus size={15} />
          新建对话
        </button>
      </div>
      <div className={styles.generateForm__conversationScroll}>
        {conversationGroups.length > 0 ? (
          conversationGroups.map((group) => (
            <section
              key={group.key}
              className={styles.generateForm__conversationGroup}
            >
              <p className={styles.generateForm__conversationDate}>
                {group.label}
              </p>
              <div className={styles.generateForm__conversationList}>
                {group.items.map((conversation) => {
                  const active = conversation.id === activeConversationId;
                  const editing = editingConversationId === conversation.id;
                  const pending = pendingConversationId === conversation.id;

                  return (
                    <div
                      key={conversation.id}
                      role="button"
                      tabIndex={0}
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        if (!editing) void selectConversation(conversation.id);
                      }}
                      onKeyDown={(event) => {
                        if (!editing && event.key === "Enter")
                          void selectConversation(conversation.id);
                      }}
                      className={classNames(
                        styles.generateForm__conversationItem,
                        active && styles.generateForm__conversationItemActive,
                        pending && styles.generateForm__conversationItemPending,
                      )}
                    >
                      <Archive
                        size={14}
                        className={styles.generateForm__conversationIcon}
                      />
                      <div className={styles.generateForm__conversationName}>
                        {editing ? (
                          <input
                            value={editingTitle}
                            autoFocus
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              setEditingTitle(event.target.value)
                            }
                            onKeyDown={(event) =>
                              handleEditingTitleKeyDown(event, conversation.id)
                            }
                            className={styles.generateForm__conversationInput}
                            aria-label="编辑对话名称"
                          />
                        ) : (
                          <span
                            className={styles.generateForm__conversationTitle}
                          >
                            {conversation.title}
                          </span>
                        )}
                      </div>
                      <div className={styles.generateForm__conversationActions}>
                        {editing ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void renameConversation(conversation.id);
                            }}
                            className={styles.generateForm__iconButton}
                            aria-label="保存对话名称"
                          >
                            <Check size={13} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              startEditingConversation(conversation);
                            }}
                            className={styles.generateForm__iconButton}
                            aria-label="编辑对话名称"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void deleteConversation(conversation.id);
                          }}
                          className={classNames(
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
          <div className={styles.generateForm__emptyConversations}>
            还没有对话
          </div>
        )}
      </div>
    </aside>
  );

  const settingsPanel = (
    <aside className={styles.generateForm__settingsPanel}>
      <SettingGroup title="模式">
        <div className={styles.generateForm__optionGridTwo}>
          <CompactOption
            active={mode === "text"}
            onClick={() => setMode("text")}
          >
            文生图
          </CompactOption>
          <CompactOption
            active={mode === "edit"}
            onClick={() => setMode("edit")}
          >
            图生图
          </CompactOption>
        </div>
      </SettingGroup>

      <SettingGroup
        title="模型"
        hint={`每次基础消耗 ${mode === "edit" ? selectedModel.imageBase : selectedModel.textBase} 积分`}
      >
        <AppSelect
          value={model}
          onChange={setModel}
          triggerClassName={styles.generateForm__selectTrigger}
          options={modelOptions.map((option) => ({
            value: option.value,
            label: `${option.label} · ${mode === "edit" ? option.imageBase : option.textBase}`,
          }))}
        />
      </SettingGroup>

      <SettingGroup title="比例">
        <div className={styles.generateForm__optionGridThree}>
          {ratios.map((item) => (
            <CompactOption
              key={item}
              active={ratio === item}
              onClick={() => setRatio(item)}
            >
              {item}
            </CompactOption>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="分辨率">
        <div className={styles.generateForm__optionGridThree}>
          {resolutions.map((item) => (
            <CompactOption
              key={item}
              active={resolution === item}
              onClick={() => setResolution(item)}
            >
              {item}
            </CompactOption>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="画质">
        <div className={styles.generateForm__optionGridFour}>
          {qualities.map((item) => (
            <CompactOption
              key={item.value}
              active={quality === item.value}
              onClick={() => setQuality(item.value)}
            >
              {item.label}
            </CompactOption>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="图片格式">
        <div className={styles.generateForm__optionGridThree}>
          {outputFormats.map((item) => (
            <CompactOption
              key={item.value}
              active={outputFormat === item.value}
              onClick={() => setOutputFormat(item.value)}
            >
              {item.label}
            </CompactOption>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="生成数量" hint={`每次生成预计消耗 ${cost} 积分`}>
        <div className={styles.generateForm__optionGridThree}>
          {imageCounts.map((item) => (
            <CompactOption
              key={item}
              active={imageCount === item}
              onClick={() => setImageCount(item)}
            >
              {item}
            </CompactOption>
          ))}
        </div>
      </SettingGroup>
    </aside>
  );

  return (
    <div className={styles.generateForm}>
      <div className={layoutClassName}>
        <div className={styles.generateForm__desktopSidebarSlot}>
          {sidebarCollapsed ? (
            <div className={styles.generateForm__sidebarPlaceholder} />
          ) : (
            <div className={styles.generateForm__sidebarWrap}>
              {conversationList}
            </div>
          )}
        </div>

        <section
          className={styles.generateForm__workspace}
          onClick={() => {
            if (settingsOpen) setSettingsOpen(false);
          }}
        >
          <div className={styles.generateForm__desktopToolbar}>
            {!settingsOpen ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (sidebarCollapsed) {
                    setSidebarCollapsed(false);
                  } else {
                    setSidebarCollapsed(true);
                  }
                }}
                className={styles.generateForm__collapseButton}
                aria-label={sidebarCollapsed ? "展开对话侧栏" : "收起对话侧栏"}
              >
                <PanelLeftClose size={16} />
              </button>
            ) : null}
          </div>
          <div className={styles.generateForm__mobileMenu}>
            <button
              type="button"
              onClick={() => setConversationPanelOpen(true)}
              className={styles.generateForm__mobileMenuButton}
              aria-label="打开对话列表"
            >
              <Menu size={17} />
            </button>
          </div>

          {settingsOpen ? (
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
                  setSidebarCollapsed(true);
                }}
                className={classNames(
                  styles.generateForm__collapseButton,
                  styles.generateForm__settingsClose,
                )}
                aria-label="收起对话侧栏"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>
          ) : null}

          <div className={styles.generateForm__promptArea}>
            <div className={styles.generateForm__promptInner}>
              <h1 className={styles.generateForm__headline}>
                你好！描述你想要的图片，我来为你生成。
              </h1>
              <p className={styles.generateForm__suggestionLabel}>
                试试这些提示词：
              </p>
              <div className={styles.generateForm__suggestions}>
                {suggestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPrompt(item)}
                    className={styles.generateForm__suggestionButton}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {tasks.length > 0 ? (
                <div className={styles.generateForm__recentTasks}>
                  {tasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={styles.generateForm__recentTask}
                    >
                      <p className={styles.generateForm__recentPrompt}>
                        {task.prompt}
                      </p>
                      <p className={styles.generateForm__recentMeta}>
                        {statusLabels[task.status] || task.status} · {task.size}{" "}
                        · {task.imageCount} 张 ·{" "}
                        {task.source === "local"
                          ? "本地自定义 · 不扣积分"
                          : `${task.costCredits} 积分`}
                      </p>
                      {task.imageUrls?.length ? (
                        <div className={styles.generateForm__recentImages}>
                          {task.imageUrls.map((url, index) => (
                            <Image
                              key={`${task.id}-${index}`}
                              className={styles.generateForm__recentImage}
                              src={url}
                              alt={task.prompt}
                              width={128}
                              height={128}
                              unoptimized
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className={styles.generateForm__composerBar}>
            <div className={styles.generateForm__composer}>
              {inputs.length > 0 ? (
                <div className={styles.generateForm__inputChips}>
                  {inputs.map((item) => (
                    <span
                      key={item.id}
                      className={styles.generateForm__inputChip}
                    >
                      <span className={styles.generateForm__inputChipName}>
                        {item.fileName || `参考图 ${item.id.slice(0, 5)}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeInput(item.id)}
                        className={styles.generateForm__chipRemove}
                        aria-label="移除参考图"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <textarea
                className={styles.generateForm__textarea}
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={
                  mode === "text"
                    ? "描述你想要的图片..."
                    : "描述你想让参考图发生什么变化..."
                }
              />

              <div className={styles.generateForm__composerFooter}>
                <div className={styles.generateForm__composerActions}>
                  <button
                    type="button"
                    onClick={createConversation}
                    className={classNames(
                      styles.generateForm__composerButton,
                      styles.generateForm__newChatComposerButton,
                    )}
                  >
                    <MessageSquarePlus size={16} />
                    新建对话
                  </button>
                  <label
                    className={styles.generateForm__uploadButton}
                    aria-label="上传参考图"
                  >
                    <ImagePlus size={18} />
                    <input
                      className={styles.generateForm__hiddenInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={(event) => onInputFiles(event.target.files)}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.generateForm__composerButton}
                  >
                    <Sparkles size={16} />
                    优化提示词
                  </button>
                </div>

                <div className={styles.generateForm__submitArea}>
                  <span className={styles.generateForm__costLabel}>
                    {localProviderEnabled
                      ? "本地自定义，不扣积分"
                      : `预计 ${cost} 积分`}
                  </span>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={loading || !prompt.trim()}
                    className={styles.generateForm__submitButton}
                    aria-label="生成图片"
                  >
                    {loading ? (
                      <RefreshCw
                        size={17}
                        className={styles.generateForm__spinning}
                      />
                    ) : (
                      <ArrowUp size={18} />
                    )}
                  </button>
                </div>
              </div>

              {message ? (
                <p
                  className={classNames(
                    styles.generateForm__message,
                    message.includes("提交")
                      ? styles.generateForm__messageInfo
                      : styles.generateForm__messageError,
                  )}
                >
                  {message}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </div>

      {conversationPanelOpen ? (
        <div
          className={styles.generateForm__mobileOverlay}
          onClick={() => setConversationPanelOpen(false)}
        >
          <div
            className={styles.generateForm__mobilePanel}
            onClick={(event) => event.stopPropagation()}
          >
            {conversationList}
          </div>
        </div>
      ) : null}

      {settingsOpen ? (
        <div
          className={classNames(
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
