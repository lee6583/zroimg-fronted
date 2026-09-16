"use client";

import clsx from "clsx";
import {
  ArrowLeft,
  CirclePower,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { adminModelsApi } from "@/api/admin/models";
import { AppSelect } from "@/components/ui/app-select";
import type {
  AdminGenerationModel,
  DiscoveredProviderModel,
  GenerationModelAdapter,
  GenerationModelCatalogItem,
  GenerationProviderConnection,
  LegacyGenerationModelAdapter,
  SaveAdminGenerationModelRequest,
} from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import workspace from "./admin-workspace.module.css";

type ModelManagerProps = {
  initialModels: AdminGenerationModel[];
  catalog: GenerationModelCatalogItem[];
  initialConnections: GenerationProviderConnection[];
};

type FormState = {
  isLegacy: boolean;
  modelType: "image" | "video";
  modelCode: string;
  adapter: LegacyGenerationModelAdapter;
  apiBaseUrl: string;
  connectionId: string;
  providerModelCode: string;
  modelName: string;
  capabilityProfile: string;
  verificationStatus: "verified" | "unverified";
  status: "enabled" | "disabled";
  defaultFlag: 0 | 1;
  sortOrder: string;
  imageToImageEnabled: boolean;
  imageToVideoEnabled: boolean;
  ratios: string[];
  qualities: string[];
  resolutions: string[];
  minDuration: string;
  maxDuration: string;
  maxCount: string;
  pointsByQuality: Record<string, string>;
  pointsPerSecond: Record<string, string>;
  referencePoints: Record<string, string>;
};

type DiscoveryState = "idle" | "success" | "empty" | "error";

type ConnectionForm = {
  id: string | null;
  name: string;
  adapter: GenerationModelAdapter;
  apiBaseUrl: string;
  apiKey: string;
  clearApiKey: boolean;
  status: "enabled" | "disabled";
};

type EditorTab = "basic" | "capabilities" | "pricing";
type ListField = "ratios" | "qualities" | "resolutions";
type ConnectionPanelMode = "list" | "edit";

type CapabilityView = {
  imageToImageSupported: boolean;
  imageToVideoSupported: boolean;
  ratios: string[];
  qualities: string[];
  resolutions: string[];
  minDuration: number | null;
  maxDuration: number | null;
  maxCount: number;
};

const adapterLabels: Record<LegacyGenerationModelAdapter, string> = {
  openai: "OpenAI",
  grok: "Grok",
  "generic-video": "历史视频服务",
};

const connectionAdapterLabels: Record<GenerationModelAdapter, string> = {
  openai: "OpenAI",
  grok: "Grok",
};

const modelTypeLabels = {
  image: "图片",
  video: "视频",
} as const;

const qualityLabels: Record<string, string> = {
  low: "1K",
  medium: "2K",
  high: "4K",
  auto: "自动",
};

function stringRecord(values: Record<string, number> | undefined) {
  return Object.fromEntries(
    Object.entries(values ?? {}).map(([key, value]) => [key, String(value)]),
  );
}

function emptyConnectionForm(): ConnectionForm {
  return {
    id: null,
    name: "",
    adapter: "openai",
    apiBaseUrl: "",
    apiKey: "",
    clearApiKey: false,
    status: "disabled",
  };
}

function connectionFormFromConnection(connection: GenerationProviderConnection): ConnectionForm {
  return {
    id: connection.id,
    name: connection.name,
    adapter: connection.adapter,
    apiBaseUrl: connection.apiBaseUrl,
    apiKey: "",
    clearApiKey: false,
    status: connection.status,
  };
}

function createForm(item: GenerationModelCatalogItem | undefined): FormState {
  return {
    isLegacy: false,
    modelType: item?.modelType ?? "image",
    modelCode: "",
    adapter: item?.adapter ?? "openai",
    apiBaseUrl: item?.defaultApiBaseUrl ?? "",
    connectionId: "",
    providerModelCode: "",
    modelName: item?.modelName ?? "",
    capabilityProfile: item?.capabilityProfile ?? item?.modelCode ?? "",
    verificationStatus: "unverified",
    status: "disabled",
    defaultFlag: 0,
    sortOrder: "10",
    imageToImageEnabled: item?.imageToImageSupported ?? false,
    imageToVideoEnabled: item?.imageToVideoSupported ?? false,
    ratios: [...(item?.ratios ?? [])],
    qualities: [...(item?.qualities ?? [])],
    resolutions: [...(item?.resolutions ?? [])],
    minDuration: String(item?.minDuration ?? 1),
    maxDuration: String(item?.maxDuration ?? 15),
    maxCount: String(item?.maxCount ?? 1),
    pointsByQuality: stringRecord(item?.defaultPoints),
    pointsPerSecond: stringRecord(item?.defaultPointsPerSecond),
    referencePoints: stringRecord(item?.defaultReferencePoints),
  };
}

function formFromModel(
  model: AdminGenerationModel,
  catalog: GenerationModelCatalogItem[],
): FormState {
  const profile = catalog.find((item) => item.capabilityProfile === model.capabilityProfile);
  return {
    isLegacy: model.connectionId === null,
    modelType: model.modelType,
    modelCode: model.modelCode,
    adapter: model.adapter,
    apiBaseUrl: model.apiBaseUrl ?? "",
    connectionId: model.connectionId ?? "",
    providerModelCode: model.providerModelCode,
    modelName: model.modelName,
    capabilityProfile: model.capabilityProfile || profile?.capabilityProfile || "",
    verificationStatus: model.verificationStatus,
    status: model.status,
    defaultFlag: model.defaultFlag === 1 ? 1 : 0,
    sortOrder: String(model.sortOrder),
    imageToImageEnabled: model.imageToImageEnabled,
    imageToVideoEnabled: model.imageToVideoEnabled,
    ratios: [...model.supportedRatios],
    qualities: [...model.supportedQualities],
    resolutions: [...model.supportedResolutions],
    minDuration: String(model.minDuration ?? profile?.minDuration ?? 1),
    maxDuration: String(model.maxDuration ?? profile?.maxDuration ?? 15),
    maxCount: String(model.maxCount || profile?.maxCount || 1),
    pointsByQuality: stringRecord(model.pointsByQuality),
    pointsPerSecond: stringRecord(model.pointsPerSecondByResolution),
    referencePoints: stringRecord(model.referencePointsByResolution),
  };
}

function applyProfile(form: FormState, profile: GenerationModelCatalogItem): FormState {
  return {
    ...form,
    isLegacy: false,
    modelType: profile.modelType,
    adapter: profile.adapter,
    apiBaseUrl: profile.defaultApiBaseUrl,
    capabilityProfile: profile.capabilityProfile,
    imageToImageEnabled: profile.imageToImageSupported,
    imageToVideoEnabled: profile.imageToVideoSupported,
    ratios: [...profile.ratios],
    qualities: [...profile.qualities],
    resolutions: [...profile.resolutions],
    minDuration: String(profile.minDuration ?? 1),
    maxDuration: String(profile.maxDuration ?? 15),
    maxCount: String(profile.maxCount ?? 1),
    pointsByQuality: stringRecord(profile.defaultPoints),
    pointsPerSecond: stringRecord(profile.defaultPointsPerSecond),
    referencePoints: stringRecord(profile.defaultReferencePoints),
    verificationStatus: "unverified",
    status: "disabled",
    defaultFlag: 0,
  };
}

function compatibleProfile(
  catalog: GenerationModelCatalogItem[],
  form: FormState,
  adapter: GenerationModelAdapter,
) {
  return (
    catalog.find(
      (item) =>
        item.capabilityProfile === form.capabilityProfile &&
        item.modelType === form.modelType &&
        item.adapter === adapter,
    ) ??
    catalog.find((item) => item.modelType === form.modelType && item.adapter === adapter) ??
    null
  );
}

function readInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${label}必须是整数`);
  }
  return parsed;
}

function capabilitiesText(model: AdminGenerationModel) {
  if (model.modelType === "video") {
    return model.imageToVideoEnabled ? "文生视频 / 图生视频" : "文生视频";
  }
  return model.imageToImageEnabled ? "文生图 / 图生图" : "文生图";
}

function pricingText(model: AdminGenerationModel) {
  if (model.modelType === "video") {
    return model.supportedResolutions
      .map(
        (resolution) => `${resolution} ${model.pointsPerSecondByResolution[resolution] ?? "-"}/秒`,
      )
      .join(" / ");
  }
  return model.supportedQualities
    .map(
      (quality) => `${qualityLabels[quality] ?? quality} ${model.pointsByQuality[quality] ?? "-"}`,
    )
    .join(" / ");
}

function verificationLabel(status: AdminGenerationModel["verificationStatus"]) {
  return status === "verified" ? "已验证" : "未验证";
}

function sortConnections(connections: GenerationProviderConnection[]) {
  return [...connections].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "enabled" ? -1 : 1;
    }
    return a.name.localeCompare(b.name, "zh-CN");
  });
}

function capabilityView(
  form: FormState,
  profile: GenerationModelCatalogItem | null,
): CapabilityView | null {
  if (profile) {
    return profile;
  }
  if (!form.isLegacy) {
    return null;
  }
  const minDuration = Number(form.minDuration);
  const maxDuration = Number(form.maxDuration);
  const maxCount = Number(form.maxCount);
  return {
    imageToImageSupported: form.imageToImageEnabled,
    imageToVideoSupported: form.imageToVideoEnabled,
    ratios: form.ratios,
    qualities: form.qualities,
    resolutions: form.resolutions,
    minDuration: Number.isInteger(minDuration) ? minDuration : null,
    maxDuration: Number.isInteger(maxDuration) ? maxDuration : null,
    maxCount: Number.isInteger(maxCount) ? maxCount : 1,
  };
}

export function ModelManager({ initialModels, catalog, initialConnections }: ModelManagerProps) {
  const [models, setModels] = useState(initialModels);
  const [connections, setConnections] = useState(() => sortConnections(initialConnections));
  const [form, setForm] = useState(() => createForm(catalog[0]));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("basic");
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [discoveredModels, setDiscoveredModels] = useState<DiscoveredProviderModel[]>([]);
  const [discoveredConnectionId, setDiscoveredConnectionId] = useState<string | null>(null);
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>("idle");
  const [isDiscovering, setDiscovering] = useState(false);
  const [isConnectionPanelOpen, setConnectionPanelOpen] = useState(false);
  const [connectionPanelMode, setConnectionPanelMode] = useState<ConnectionPanelMode>("list");
  const [connectionForm, setConnectionForm] = useState(emptyConnectionForm);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [isConnectionSaving, setConnectionSaving] = useState(false);
  const [connectionReturnToModel, setConnectionReturnToModel] = useState(false);
  const [connectionDiscoveredModels, setConnectionDiscoveredModels] = useState<
    DiscoveredProviderModel[]
  >([]);
  const [connectionDiscoveryState, setConnectionDiscoveryState] = useState<DiscoveryState>("idle");
  const [isConnectionDiscovering, setConnectionDiscovering] = useState(false);

  const selectedConnection = useMemo(
    () => connections.find((item) => item.id === form.connectionId) ?? null,
    [connections, form.connectionId],
  );
  const selectedProfile = useMemo(
    () => catalog.find((item) => item.capabilityProfile === form.capabilityProfile) ?? null,
    [catalog, form.capabilityProfile],
  );
  const profileView = capabilityView(form, selectedProfile);
  const isVideo = form.modelType === "video";
  const isVerified = form.verificationStatus === "verified";
  const canUseModel = form.isLegacy || isVerified;
  const discoveredForCurrentConnection =
    discoveryState === "success" && discoveredConnectionId === form.connectionId
      ? discoveredModels
      : [];
  const canEnterProviderModelManually =
    !form.isLegacy && (discoveryState === "empty" || discoveryState === "error");

  function updateForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(createForm(catalog[0]));
    setActiveTab("basic");
    setMessage("");
    setDiscoveredModels([]);
    setDiscoveredConnectionId(null);
    setDiscoveryState("idle");
    setEditorOpen(true);
  }

  function openEdit(model: AdminGenerationModel) {
    setEditingId(model.id);
    setForm(formFromModel(model, catalog));
    setActiveTab("basic");
    setMessage("");
    setDiscoveredModels([]);
    setDiscoveredConnectionId(null);
    setDiscoveryState("idle");
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(null);
    setMessage("");
    setDiscoveredModels([]);
    setDiscoveredConnectionId(null);
    setDiscoveryState("idle");
  }

  function selectProfile(profileCode: string) {
    const profile = catalog.find((item) => item.capabilityProfile === profileCode);
    if (!profile) {
      return;
    }
    setForm((current) => {
      const next = applyProfile(current, profile);
      const connection = connections.find((item) => item.id === current.connectionId);
      return connection
        ? { ...next, adapter: connection.adapter, apiBaseUrl: connection.apiBaseUrl }
        : next;
    });
    setDiscoveredModels([]);
    setDiscoveredConnectionId(null);
    setDiscoveryState("idle");
  }

  function selectConnection(connectionId: string) {
    const connection = connections.find((item) => item.id === connectionId);
    if (!connection) {
      updateForm({
        connectionId: "",
        isLegacy: Boolean(editingId),
        providerModelCode: "",
        verificationStatus: "unverified",
        status: "disabled",
        defaultFlag: 0,
      });
      return;
    }

    const compatible = compatibleProfile(catalog, form, connection.adapter);

    if (!compatible) {
      setForm((current) => ({
        ...current,
        isLegacy: false,
        connectionId,
        adapter: connection.adapter,
        apiBaseUrl: connection.apiBaseUrl,
        providerModelCode: "",
        capabilityProfile: "",
        verificationStatus: "unverified",
        status: "disabled",
        defaultFlag: 0,
      }));
    } else if (
      compatible.capabilityProfile !== form.capabilityProfile ||
      compatible.modelType !== form.modelType
    ) {
      setForm((current) => {
        const next = applyProfile(
          {
            ...current,
            isLegacy: false,
            connectionId,
            providerModelCode: "",
            adapter: connection.adapter,
            apiBaseUrl: connection.apiBaseUrl,
          },
          compatible,
        );
        return { ...next, adapter: connection.adapter, apiBaseUrl: connection.apiBaseUrl };
      });
    } else {
      updateForm({
        isLegacy: false,
        adapter: connection.adapter,
        apiBaseUrl: connection.apiBaseUrl,
        connectionId,
        providerModelCode: form.connectionId === connectionId ? form.providerModelCode : "",
        verificationStatus:
          form.connectionId === connectionId ? form.verificationStatus : "unverified",
        status: form.connectionId === connectionId ? form.status : "disabled",
        defaultFlag: form.connectionId === connectionId ? form.defaultFlag : 0,
      });
    }
    setDiscoveredModels([]);
    setDiscoveredConnectionId(null);
    setDiscoveryState("idle");
  }

  function selectProviderModel(providerModelCode: string) {
    const verified = discoveredForCurrentConnection.some((item) => item.id === providerModelCode);
    const manual = canEnterProviderModelManually;
    updateForm({
      providerModelCode,
      verificationStatus: verified && !manual ? "verified" : "unverified",
      status: verified && !manual ? form.status : "disabled",
      defaultFlag: verified && !manual ? form.defaultFlag : 0,
    });
  }

  function toggleListValue(field: ListField, value: string) {
    setForm((current) => {
      const values = current[field];
      const next = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
      return { ...current, [field]: next };
    });
  }

  async function discoverCurrentConnection() {
    if (!form.connectionId) {
      setMessage("请先选择中转站连接");
      return;
    }

    const connectionId = form.connectionId;
    setDiscovering(true);
    setMessage("");
    setDiscoveryState("idle");
    setDiscoveredModels([]);
    try {
      const result = await adminModelsApi.discoverSavedConnection(connectionId);
      setDiscoveredModels(result.models);
      setDiscoveredConnectionId(connectionId);
      if (result.models.length > 0) {
        setDiscoveryState("success");
      } else {
        setDiscoveryState("empty");
      }
      if (result.models.some((item) => item.id === form.providerModelCode.trim())) {
        updateForm({ verificationStatus: "verified" });
      } else {
        updateForm({
          providerModelCode: result.models.length > 0 ? "" : form.providerModelCode,
          verificationStatus: "unverified",
          status: "disabled",
          defaultFlag: 0,
        });
        if (result.models.length === 0) {
          setMessage("中转站没有返回可用模型");
        }
      }
    } catch (error) {
      setDiscoveredModels([]);
      setDiscoveredConnectionId(connectionId);
      setDiscoveryState("error");
      updateForm({ verificationStatus: "unverified", status: "disabled", defaultFlag: 0 });
      setMessage(getErrorMessage(error));
    } finally {
      setDiscovering(false);
    }
  }

  function buildPayload(): SaveAdminGenerationModelRequest {
    const common = {
      modelName: form.modelName.trim(),
      status: form.status,
      defaultFlag: form.defaultFlag,
      sortOrder: readInteger(form.sortOrder, "排序"),
      ratios: form.ratios,
    } as const;

    if (form.isLegacy && !selectedConnection) {
      if (!form.modelCode.trim()) {
        throw new Error("历史模型编码不能为空");
      }
      if (!form.apiBaseUrl.trim()) {
        throw new Error("历史模型 API 地址不能为空");
      }
      if (form.modelType === "image") {
        const qualityPrices = form.qualities.map((quality) => ({
          quality,
          points: readInteger(
            form.pointsByQuality[quality] ?? "",
            `${qualityLabels[quality] ?? quality}积分`,
          ),
        }));
        if (qualityPrices.some((item) => item.points < 0)) {
          throw new Error("积分不能小于 0");
        }
        return {
          ...common,
          modelCode: form.modelCode,
          adapter: form.adapter,
          apiBaseUrl: form.apiBaseUrl,
          apiKey: "",
          clearApiKey: false,
          modelType: "image",
          imageToImageEnabled: form.imageToImageEnabled,
          qualities: form.qualities,
          maxCount: readInteger(form.maxCount, "最大生成数量"),
          qualityPrices,
        };
      }

      const videoPrices = form.resolutions.map((resolution) => ({
        resolution,
        pointsPerSecond: readInteger(
          form.pointsPerSecond[resolution] ?? "",
          `${resolution}每秒积分`,
        ),
        referencePoints: readInteger(
          form.referencePoints[resolution] ?? "",
          `${resolution}参考图积分`,
        ),
      }));
      if (videoPrices.some((item) => item.pointsPerSecond < 0 || item.referencePoints < 0)) {
        throw new Error("积分不能小于 0");
      }
      return {
        ...common,
        modelCode: form.modelCode,
        adapter: form.adapter,
        apiBaseUrl: form.apiBaseUrl,
        apiKey: "",
        clearApiKey: false,
        modelType: "video",
        imageToVideoEnabled: form.imageToVideoEnabled,
        resolutions: form.resolutions,
        minDuration: readInteger(form.minDuration, "最短时长"),
        maxDuration: readInteger(form.maxDuration, "最长时长"),
        videoPrices,
      };
    }

    if (!selectedConnection) {
      throw new Error("请选择中转站连接");
    }
    if (!selectedProfile) {
      throw new Error("请选择能力模板");
    }
    const providerModelCode = form.providerModelCode.trim();
    if (!providerModelCode) {
      throw new Error("请选择或填写供应商模型 ID");
    }

    const manuallyEntered = canEnterProviderModelManually;
    const verified =
      !manuallyEntered &&
      (isVerified || discoveredForCurrentConnection.some((item) => item.id === providerModelCode));
    const base = {
      connectionId: selectedConnection.id,
      providerModelCode,
      modelName: form.modelName.trim() || selectedProfile.modelName,
      capabilityProfile: selectedProfile.capabilityProfile,
      status: verified ? form.status : "disabled",
      defaultFlag: verified ? form.defaultFlag : 0,
      sortOrder: readInteger(form.sortOrder, "排序"),
      ratios: form.ratios,
    } as const;

    if (form.modelType === "image") {
      const qualityPrices = form.qualities.map((quality) => ({
        quality,
        points: readInteger(
          form.pointsByQuality[quality] ?? "",
          `${qualityLabels[quality] ?? quality}积分`,
        ),
      }));
      if (qualityPrices.some((item) => item.points < 0)) {
        throw new Error("积分不能小于 0");
      }
      return {
        ...base,
        modelType: "image",
        imageToImageEnabled: form.imageToImageEnabled,
        qualities: form.qualities,
        maxCount: readInteger(form.maxCount, "最大生成数量"),
        qualityPrices,
      };
    }

    const videoPrices = form.resolutions.map((resolution) => ({
      resolution,
      pointsPerSecond: readInteger(form.pointsPerSecond[resolution] ?? "", `${resolution}每秒积分`),
      referencePoints: readInteger(
        form.referencePoints[resolution] ?? "",
        `${resolution}参考图积分`,
      ),
    }));
    if (videoPrices.some((item) => item.pointsPerSecond < 0 || item.referencePoints < 0)) {
      throw new Error("积分不能小于 0");
    }
    return {
      ...base,
      modelType: "video",
      imageToVideoEnabled: form.imageToVideoEnabled,
      resolutions: form.resolutions,
      minDuration: readInteger(form.minDuration, "最短时长"),
      maxDuration: readInteger(form.maxDuration, "最长时长"),
      videoPrices,
    };
  }

  function replaceModel(model: AdminGenerationModel) {
    setModels((current) => {
      const found = current.some((item) => item.id === model.id);
      const next = found
        ? current.map((item) => (item.id === model.id ? model : item))
        : [...current, model];
      return next.map((item) =>
        model.defaultFlag === 1 && item.id !== model.id && item.modelType === model.modelType
          ? { ...item, defaultFlag: 0 }
          : item,
      );
    });
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      if (form.ratios.length === 0) {
        throw new Error("至少选择一个比例");
      }
      if (!isVideo && form.qualities.length === 0) {
        throw new Error("至少选择一个画质档位");
      }
      if (isVideo && form.resolutions.length === 0) {
        throw new Error("至少选择一个视频分辨率");
      }
      const payload = buildPayload();
      const result = editingId
        ? await adminModelsApi.update(editingId, payload)
        : await adminModelsApi.create(payload);
      replaceModel(result.model);
      closeEditor();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(model: AdminGenerationModel) {
    try {
      const status = model.status === "enabled" ? "disabled" : "enabled";
      const result = await adminModelsApi.updateStatus(model.id, status);
      replaceModel(result.model);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function setDefault(model: AdminGenerationModel) {
    try {
      const result = await adminModelsApi.setDefault(model.id);
      replaceModel(result.model);
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function remove(model: AdminGenerationModel) {
    if (!window.confirm(`确定删除模型“${model.modelName}”吗？`)) {
      return;
    }
    try {
      await adminModelsApi.remove(model.id);
      setModels((current) => current.filter((item) => item.id !== model.id));
      if (editingId === model.id) {
        closeEditor();
      }
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  function openConnectionManager(returnToModel = false) {
    setConnectionReturnToModel(returnToModel);
    setConnectionPanelMode("list");
    setConnectionForm(emptyConnectionForm());
    setConnectionMessage("");
    setConnectionDiscoveredModels([]);
    setConnectionDiscoveryState("idle");
    setConnectionPanelOpen(true);
  }

  function openCreateConnection() {
    setConnectionPanelMode("edit");
    setConnectionForm(emptyConnectionForm());
    setConnectionMessage("");
    setConnectionDiscoveredModels([]);
    setConnectionDiscoveryState("idle");
  }

  function openEditConnection(connection: GenerationProviderConnection) {
    setConnectionPanelMode("edit");
    setConnectionForm(connectionFormFromConnection(connection));
    setConnectionMessage("");
    setConnectionDiscoveredModels([]);
    setConnectionDiscoveryState("idle");
  }

  function closeConnectionPanel() {
    closeConnectionPanelWithOptions();
  }

  function closeConnectionPanelWithOptions(preserveDiscovery = false) {
    setConnectionPanelOpen(false);
    setConnectionPanelMode("list");
    setConnectionForm(emptyConnectionForm());
    setConnectionMessage("");
    setConnectionDiscoveredModels([]);
    setConnectionDiscoveryState("idle");
    if (!preserveDiscovery) {
      setDiscoveredModels([]);
      setDiscoveredConnectionId(null);
      setDiscoveryState("idle");
    }
    setConnectionReturnToModel(false);
  }

  function updateConnectionForm(patch: Partial<ConnectionForm>) {
    const nextPatch =
      "apiKey" in patch && typeof patch.apiKey === "string" && patch.apiKey.trim()
        ? { ...patch, clearApiKey: false }
        : patch;
    setConnectionForm((current) => ({ ...current, ...nextPatch }));
    if (
      "adapter" in patch ||
      "apiBaseUrl" in patch ||
      "apiKey" in patch ||
      "clearApiKey" in patch
    ) {
      setConnectionDiscoveredModels([]);
      setConnectionDiscoveryState("idle");
    }
  }

  async function discoverConnectionForm() {
    if (connectionForm.clearApiKey && !connectionForm.apiKey.trim()) {
      setConnectionMessage("已勾选清除 API Key，请先填写新的 API Key 后再拉取模型");
      return;
    }
    setConnectionDiscoveredModels([]);
    setConnectionDiscoveryState("idle");
    setConnectionDiscovering(true);
    setConnectionMessage("");
    try {
      const result =
        connectionForm.id && !connectionForm.apiKey.trim()
          ? await adminModelsApi.discoverSavedConnection(connectionForm.id)
          : await adminModelsApi.discoverConnection({
              adapter: connectionForm.adapter,
              apiBaseUrl: connectionForm.apiBaseUrl.trim(),
              apiKey: connectionForm.apiKey.trim(),
            });
      setConnectionDiscoveredModels(result.models);
      setConnectionDiscoveryState(result.models.length > 0 ? "success" : "empty");
      if (result.models.length === 0) {
        setConnectionMessage("中转站没有返回可用模型");
      }
    } catch (error) {
      setConnectionDiscoveredModels([]);
      setConnectionDiscoveryState("error");
      setConnectionMessage(getErrorMessage(error));
    } finally {
      setConnectionDiscovering(false);
    }
  }

  async function saveConnection() {
    setConnectionSaving(true);
    setConnectionMessage("");
    try {
      if (!connectionForm.name.trim()) {
        throw new Error("请输入连接名称");
      }
      if (!connectionForm.apiBaseUrl.trim()) {
        throw new Error("请输入中转站地址");
      }
      if (
        connectionForm.status === "enabled" &&
        !connectionForm.apiKey.trim() &&
        !connectionForm.id
      ) {
        throw new Error("启用连接时必须填写 API Key");
      }
      if (connectionForm.clearApiKey && connectionForm.apiKey.trim()) {
        throw new Error("不能同时替换和清除 API Key");
      }
      const modelFormBeforeSave = form;
      const returningToModel = connectionReturnToModel;
      const modelDiscoveryMatchesConnection =
        returningToModel &&
        Boolean(modelFormBeforeSave.connectionId) &&
        modelFormBeforeSave.connectionId === connectionForm.id &&
        discoveredConnectionId === modelFormBeforeSave.connectionId;
      const discoveryStateBeforeSave =
        connectionDiscoveryState !== "idle"
          ? connectionDiscoveryState
          : modelDiscoveryMatchesConnection
            ? discoveryState
            : "idle";
      const discoveryModelsBeforeSave =
        connectionDiscoveryState !== "idle"
          ? connectionDiscoveredModels
          : modelDiscoveryMatchesConnection
            ? discoveredModels
            : [];
      const previousConnection = connectionForm.id
        ? connections.find((item) => item.id === connectionForm.id)
        : undefined;
      const normalizedApiBaseUrl = connectionForm.apiBaseUrl.trim();
      const providerConfigChanged = previousConnection
        ? previousConnection.adapter !== connectionForm.adapter ||
          previousConnection.apiBaseUrl !== normalizedApiBaseUrl ||
          previousConnection.status !== connectionForm.status ||
          Boolean(connectionForm.clearApiKey) ||
          Boolean(connectionForm.apiKey.trim())
        : false;
      const reuseDiscovery = !providerConfigChanged;
      const discoveredBeforeSave = reuseDiscovery ? discoveryModelsBeforeSave : [];
      const connectionResponse = connectionForm.id
        ? await adminModelsApi.updateConnection(connectionForm.id, {
            name: connectionForm.name.trim(),
            adapter: connectionForm.adapter,
            apiBaseUrl: normalizedApiBaseUrl,
            apiKey: connectionForm.apiKey.trim(),
            clearApiKey: connectionForm.clearApiKey,
            status: connectionForm.status,
          })
        : await adminModelsApi.createConnection({
            name: connectionForm.name.trim(),
            adapter: connectionForm.adapter,
            apiBaseUrl: normalizedApiBaseUrl,
            apiKey: connectionForm.apiKey.trim(),
            clearApiKey: false,
            status: connectionForm.status,
          });
      const connection = connectionResponse.connection;
      setConnections((current) =>
        sortConnections(
          current.some((item) => item.id === connection.id)
            ? current.map((item) => (item.id === connection.id ? connection : item))
            : [...current, connection],
        ),
      );
      if (providerConfigChanged) {
        setModels((current) =>
          current.map((model) =>
            model.connectionId === connection.id
              ? {
                  ...model,
                  status: "disabled",
                  defaultFlag: 0,
                  verificationStatus: "unverified",
                  verifiedAt: null,
                }
              : model,
          ),
        );
        if (form.connectionId === connection.id) {
          updateForm({ verificationStatus: "unverified", status: "disabled", defaultFlag: 0 });
        }
      }
      if (returningToModel) {
        const profile = compatibleProfile(catalog, modelFormBeforeSave, connection.adapter);
        const profileMatchesCurrentForm = Boolean(
          profile &&
          profile.capabilityProfile === modelFormBeforeSave.capabilityProfile &&
          profile.modelType === modelFormBeforeSave.modelType &&
          profile.adapter === connection.adapter,
        );
        const canKeepProviderModelCode =
          Boolean(connectionForm.id) &&
          modelFormBeforeSave.connectionId === connection.id &&
          !modelFormBeforeSave.isLegacy;
        const providerModelCode = canKeepProviderModelCode
          ? modelFormBeforeSave.providerModelCode
          : "";
        const discoveredModelIsSelected = discoveredBeforeSave.some(
          (item) => item.id === providerModelCode.trim(),
        );
        const verificationStatus = providerConfigChanged
          ? "unverified"
          : discoveredModelIsSelected
            ? "verified"
            : canKeepProviderModelCode
              ? modelFormBeforeSave.verificationStatus
              : "unverified";
        const status =
          connection.status !== "enabled" || verificationStatus !== "verified"
            ? "disabled"
            : modelFormBeforeSave.status;
        const defaultFlag =
          status === "enabled" && verificationStatus === "verified"
            ? modelFormBeforeSave.defaultFlag
            : 0;

        setForm(() => {
          const base: FormState = {
            ...modelFormBeforeSave,
            isLegacy: false,
            connectionId: connection.id,
            adapter: connection.adapter,
            apiBaseUrl: connection.apiBaseUrl,
            providerModelCode,
            verificationStatus,
            status,
            defaultFlag,
          };
          if (!profile || profileMatchesCurrentForm) {
            return base;
          }
          const reset = applyProfile(base, profile);
          return {
            ...reset,
            adapter: connection.adapter,
            apiBaseUrl: connection.apiBaseUrl,
            providerModelCode,
            verificationStatus,
            status,
            defaultFlag,
          };
        });
        setDiscoveredModels(discoveredBeforeSave);
        setDiscoveredConnectionId(
          discoveredBeforeSave.length > 0 || discoveryStateBeforeSave !== "idle"
            ? connection.id
            : null,
        );
        setDiscoveryState(
          !reuseDiscovery
            ? "idle"
            : discoveryStateBeforeSave === "success"
              ? "success"
              : discoveryStateBeforeSave === "empty"
                ? "empty"
                : discoveryStateBeforeSave === "error"
                  ? "error"
                  : "idle",
        );
        closeConnectionPanelWithOptions(true);
      } else {
        setConnectionPanelMode("list");
        setConnectionForm(emptyConnectionForm());
        setConnectionDiscoveredModels([]);
        setConnectionDiscoveryState("idle");
      }
    } catch (error) {
      setConnectionMessage(getErrorMessage(error));
    } finally {
      setConnectionSaving(false);
    }
  }

  async function removeConnection(connection: GenerationProviderConnection) {
    if (!window.confirm(`确定删除连接“${connection.name}”吗？`)) {
      return;
    }
    try {
      await adminModelsApi.removeConnection(connection.id);
      setConnections((current) => current.filter((item) => item.id !== connection.id));
      if (form.connectionId === connection.id) {
        updateForm({
          connectionId: "",
          providerModelCode: "",
          verificationStatus: "unverified",
          status: "disabled",
          defaultFlag: 0,
        });
      }
    } catch (error) {
      setConnectionMessage(getErrorMessage(error));
    }
  }

  function selectConnectionDiscoveredModel(model: DiscoveredProviderModel) {
    if (!connectionReturnToModel || !connectionForm.id) {
      return;
    }
    const connectionId = connectionForm.id;
    setForm((current) => ({
      ...current,
      isLegacy: false,
      connectionId,
      adapter: connections.find((item) => item.id === connectionId)?.adapter ?? current.adapter,
      apiBaseUrl:
        connections.find((item) => item.id === connectionId)?.apiBaseUrl ?? current.apiBaseUrl,
      providerModelCode: model.id,
      verificationStatus: "verified",
    }));
    setDiscoveredModels(connectionDiscoveredModels);
    setDiscoveredConnectionId(connectionId);
    setDiscoveryState("success");
    closeConnectionPanelWithOptions(true);
  }

  function renderEditor() {
    return (
      <section className={workspace.editor}>
        <header className={workspace.editorHeader}>
          <div>
            <button className={workspace.editorBack} type="button" onClick={closeEditor}>
              <ArrowLeft size={14} aria-hidden="true" />
              返回模型列表
            </button>
            <h1 className={workspace.editorTitle}>{editingId ? "编辑模型" : "新建模型"}</h1>
          </div>
          <div className={workspace.editorActions}>
            <button className={workspace.secondaryAction} type="button" onClick={closeEditor}>
              取消
            </button>
            <button
              className={workspace.primaryAction}
              type="button"
              disabled={isSaving}
              onClick={save}
            >
              <Save size={15} aria-hidden="true" />
              {isSaving ? "保存中" : "保存模型"}
            </button>
          </div>
        </header>

        <nav className={workspace.tabs} aria-label="模型配置分区">
          {[
            { value: "basic" as const, label: "基本信息" },
            { value: "capabilities" as const, label: "用户能力" },
            { value: "pricing" as const, label: "积分价格" },
          ].map((tab) => (
            <button
              key={tab.value}
              className={clsx(workspace.tab, activeTab === tab.value && workspace.tabActive)}
              type="button"
              aria-current={activeTab === tab.value ? "page" : undefined}
              onClick={() => setActiveTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {message ? <p className={workspace.inlineMessage}>{message}</p> : null}

        <div className={workspace.editorBody}>
          {activeTab === "basic" ? (
            <div className={workspace.formSection}>
              <div className={workspace.formGrid}>
                <div className={workspace.fieldGroup}>
                  <span className={workspace.fieldLabel}>中转站连接</span>
                  <div className={workspace.fieldWithAction}>
                    <AppSelect
                      value={form.connectionId}
                      onChange={selectConnection}
                      placeholder="请选择连接"
                      options={connections.map((connection) => ({
                        value: connection.id,
                        label: `${connection.name} · ${adapterLabels[connection.adapter]}`,
                      }))}
                    />
                    <button
                      className={workspace.iconAction}
                      type="button"
                      title="新建连接"
                      onClick={() => {
                        setConnectionPanelOpen(true);
                        setConnectionReturnToModel(true);
                        openCreateConnection();
                      }}
                    >
                      <Plus size={15} aria-hidden="true" />
                    </button>
                  </div>
                  {!connections.length ? (
                    <button
                      className={workspace.inlineLink}
                      type="button"
                      onClick={() => openConnectionManager(true)}
                    >
                      <Link2 size={14} aria-hidden="true" />
                      创建中转站连接
                    </button>
                  ) : null}
                </div>

                <div className={workspace.fieldGroup}>
                  <span className={workspace.fieldLabel}>能力模板</span>
                  {form.isLegacy ? (
                    <input
                      className={workspace.formField}
                      value={form.capabilityProfile || "历史配置"}
                      readOnly
                      aria-label="能力模板"
                    />
                  ) : (
                    <AppSelect
                      value={form.capabilityProfile}
                      onChange={selectProfile}
                      placeholder="请选择能力模板"
                      options={catalog.map((item) => ({
                        value: item.capabilityProfile,
                        label: `${item.modelName} · ${modelTypeLabels[item.modelType]}`,
                        disabled: Boolean(
                          selectedConnection && item.adapter !== selectedConnection.adapter,
                        ),
                      }))}
                    />
                  )}
                </div>

                <label className={workspace.fieldGroup}>
                  <span className={workspace.fieldLabel}>展示名称</span>
                  <input
                    className={workspace.formField}
                    value={form.modelName}
                    maxLength={100}
                    onChange={(event) => updateForm({ modelName: event.target.value })}
                  />
                </label>

                <label className={workspace.fieldGroup}>
                  <span className={workspace.fieldLabel}>模型类型</span>
                  <input
                    className={workspace.formField}
                    value={modelTypeLabels[form.modelType]}
                    readOnly
                    aria-label="模型类型"
                  />
                </label>

                <label className={clsx(workspace.fieldGroup, workspace.fieldGroupFull)}>
                  <span className={workspace.fieldLabel}>供应商模型 ID</span>
                  {form.isLegacy ? (
                    <input
                      className={workspace.formField}
                      value={form.providerModelCode}
                      readOnly
                      aria-label="历史供应商模型 ID"
                    />
                  ) : discoveredForCurrentConnection.length ? (
                    <select
                      className={workspace.formField}
                      value={form.providerModelCode}
                      onChange={(event) => selectProviderModel(event.target.value)}
                    >
                      <option value="">从可用模型中选择</option>
                      {discoveredForCurrentConnection.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.id}
                          {model.ownedBy ? ` · ${model.ownedBy}` : ""}
                        </option>
                      ))}
                    </select>
                  ) : canEnterProviderModelManually ? (
                    <input
                      className={workspace.formField}
                      value={form.providerModelCode}
                      maxLength={200}
                      placeholder="请输入供应商模型 ID"
                      onChange={(event) => selectProviderModel(event.target.value)}
                    />
                  ) : (
                    <input
                      className={workspace.formField}
                      value={form.providerModelCode}
                      readOnly
                      placeholder="请先拉取可用模型"
                      aria-label="供应商模型 ID"
                    />
                  )}
                </label>

                <div className={clsx(workspace.fieldGroup, workspace.fieldGroupFull)}>
                  <div className={workspace.connectionToolbar}>
                    <span className={workspace.fieldLabel}>供应商模型列表</span>
                    <button
                      className={workspace.secondaryAction}
                      type="button"
                      disabled={!form.connectionId || isDiscovering}
                      onClick={discoverCurrentConnection}
                    >
                      <RefreshCw size={14} aria-hidden="true" />
                      {isDiscovering ? "拉取中" : "拉取可用模型"}
                    </button>
                  </div>
                  <span className={workspace.fieldHint}>
                    {selectedConnection
                      ? `${selectedConnection.name} · ${selectedConnection.apiBaseUrl}`
                      : form.isLegacy
                        ? `历史配置：${form.apiBaseUrl || "未记录地址"}`
                        : "请选择中转站连接"}
                  </span>
                </div>

                <label className={workspace.fieldGroup}>
                  <span className={workspace.fieldLabel}>排序</span>
                  <input
                    className={workspace.formField}
                    type="number"
                    value={form.sortOrder}
                    onChange={(event) => updateForm({ sortOrder: event.target.value })}
                  />
                </label>
              </div>

              <div className={workspace.modelStateRow}>
                <span
                  className={clsx(
                    workspace.status,
                    isVerified ? workspace.statusSuccess : workspace.statusWarning,
                  )}
                >
                  {verificationLabel(form.verificationStatus)}
                </span>
                {selectedConnection ? (
                  <span className={workspace.secondaryText}>
                    连接密钥：
                    {selectedConnection.hasApiKey ? selectedConnection.apiKeyPreview : "未配置"}
                  </span>
                ) : null}
              </div>

              <div className={workspace.switches}>
                <label className={workspace.switchRow}>
                  <span>启用模型</span>
                  <input
                    type="checkbox"
                    checked={form.status === "enabled"}
                    disabled={!canUseModel}
                    onChange={(event) =>
                      updateForm({
                        status: event.target.checked ? "enabled" : "disabled",
                        defaultFlag: event.target.checked ? form.defaultFlag : 0,
                      })
                    }
                  />
                </label>
                <label className={workspace.switchRow}>
                  <span>默认模型</span>
                  <input
                    type="checkbox"
                    checked={form.defaultFlag === 1}
                    disabled={!canUseModel || form.status !== "enabled"}
                    onChange={(event) => updateForm({ defaultFlag: event.target.checked ? 1 : 0 })}
                  />
                </label>
              </div>
            </div>
          ) : null}

          {activeTab === "capabilities" ? (
            <div className={workspace.formSection}>
              <label className={workspace.switchRow}>
                <span>{isVideo ? "图生视频" : "图生图"}</span>
                <input
                  type="checkbox"
                  disabled={
                    isVideo
                      ? profileView?.imageToVideoSupported !== true
                      : profileView?.imageToImageSupported !== true
                  }
                  checked={isVideo ? form.imageToVideoEnabled : form.imageToImageEnabled}
                  onChange={(event) =>
                    isVideo
                      ? updateForm({ imageToVideoEnabled: event.target.checked })
                      : updateForm({ imageToImageEnabled: event.target.checked })
                  }
                />
              </label>
              <OptionFieldset
                label="支持比例"
                values={profileView?.ratios ?? []}
                selected={form.ratios}
                onToggle={(value) => toggleListValue("ratios", value)}
              />
              {isVideo ? (
                <>
                  <OptionFieldset
                    label="支持分辨率"
                    values={profileView?.resolutions ?? []}
                    selected={form.resolutions}
                    onToggle={(value) => toggleListValue("resolutions", value)}
                  />
                  <div className={workspace.formGrid}>
                    <label className={workspace.fieldGroup}>
                      <span className={workspace.fieldLabel}>最短时长（秒）</span>
                      <input
                        className={workspace.formField}
                        type="number"
                        min={profileView?.minDuration ?? 1}
                        max={profileView?.maxDuration ?? 15}
                        value={form.minDuration}
                        onChange={(event) => updateForm({ minDuration: event.target.value })}
                      />
                    </label>
                    <label className={workspace.fieldGroup}>
                      <span className={workspace.fieldLabel}>最长时长（秒）</span>
                      <input
                        className={workspace.formField}
                        type="number"
                        min={profileView?.minDuration ?? 1}
                        max={profileView?.maxDuration ?? 15}
                        value={form.maxDuration}
                        onChange={(event) => updateForm({ maxDuration: event.target.value })}
                      />
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <OptionFieldset
                    label="质量档位"
                    values={profileView?.qualities ?? []}
                    selected={form.qualities}
                    onToggle={(value) => toggleListValue("qualities", value)}
                    labels={qualityLabels}
                  />
                  <label className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>最大生成数量</span>
                    <input
                      className={workspace.formField}
                      type="number"
                      min={1}
                      max={profileView?.maxCount ?? 1}
                      value={form.maxCount}
                      onChange={(event) => updateForm({ maxCount: event.target.value })}
                    />
                  </label>
                </>
              )}
            </div>
          ) : null}

          {activeTab === "pricing" ? (
            <div className={workspace.pricingList}>
              {isVideo
                ? form.resolutions.map((resolution) => (
                    <div key={resolution} className={workspace.pricingRow}>
                      <span>{resolution}</span>
                      <div className={workspace.videoPriceInputs}>
                        <label className={workspace.priceInput}>
                          <input
                            className={workspace.formField}
                            type="number"
                            min={0}
                            value={form.pointsPerSecond[resolution] ?? ""}
                            onChange={(event) =>
                              updateForm({
                                pointsPerSecond: {
                                  ...form.pointsPerSecond,
                                  [resolution]: event.target.value,
                                },
                              })
                            }
                          />
                          <span>积分 / 秒</span>
                        </label>
                        <label className={workspace.priceInput}>
                          <input
                            className={workspace.formField}
                            type="number"
                            min={0}
                            value={form.referencePoints[resolution] ?? ""}
                            onChange={(event) =>
                              updateForm({
                                referencePoints: {
                                  ...form.referencePoints,
                                  [resolution]: event.target.value,
                                },
                              })
                            }
                          />
                          <span>参考图积分</span>
                        </label>
                      </div>
                    </div>
                  ))
                : form.qualities.map((quality) => (
                    <label key={quality} className={workspace.pricingRow}>
                      <span>{qualityLabels[quality] ?? quality}</span>
                      <span className={workspace.priceInput}>
                        <input
                          className={workspace.formField}
                          type="number"
                          min={0}
                          value={form.pointsByQuality[quality] ?? ""}
                          onChange={(event) =>
                            updateForm({
                              pointsByQuality: {
                                ...form.pointsByQuality,
                                [quality]: event.target.value,
                              },
                            })
                          }
                        />
                        <span>积分 / 张</span>
                      </span>
                    </label>
                  ))}
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  function renderModelList() {
    return (
      <>
        <header className={workspace.header}>
          <div className={workspace.headerCopy}>
            <h1 className="page-title">模型配置</h1>
          </div>
          <div className={workspace.headerActions}>
            <button
              className={workspace.secondaryAction}
              type="button"
              onClick={() => openConnectionManager(false)}
            >
              <Settings2 size={15} aria-hidden="true" />
              中转站连接
            </button>
            <button
              className={workspace.primaryAction}
              type="button"
              onClick={openCreate}
              disabled={catalog.length === 0}
            >
              <Plus size={15} aria-hidden="true" />
              新建模型
            </button>
          </div>
        </header>
        {message ? <p className={workspace.inlineMessage}>{message}</p> : null}
        <section className={workspace.panel}>
          {models.length ? (
            <div className={workspace.tableWrap}>
              <table className={clsx(workspace.table, workspace.modelsTable)}>
                <thead>
                  <tr>
                    <th>模型</th>
                    <th>连接</th>
                    <th>类型 / 模板</th>
                    <th>能力</th>
                    <th>积分价格</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr key={model.id}>
                      <td data-label="模型">
                        <div className={workspace.primaryCell}>
                          <div className={workspace.modelIdentity}>
                            <span className={workspace.primaryText}>{model.modelName}</span>
                            <span className={workspace.modelBadges}>
                              <span className={workspace.badge}>
                                {modelTypeLabels[model.modelType]}
                              </span>
                              {model.defaultFlag === 1 ? (
                                <span className={workspace.badge}>默认</span>
                              ) : null}
                            </span>
                          </div>
                          <span className={workspace.monoText}>{model.providerModelCode}</span>
                        </div>
                      </td>
                      <td data-label="连接">
                        <div className={workspace.primaryCell}>
                          <span>{model.connectionName ?? "历史配置"}</span>
                          <span className={workspace.secondaryText}>
                            {adapterLabels[model.adapter]}
                          </span>
                        </div>
                      </td>
                      <td data-label="类型 / 模板">
                        <div className={workspace.primaryCell}>
                          <span>{model.capabilityProfile}</span>
                          <span className={workspace.secondaryText}>{model.modelCode}</span>
                        </div>
                      </td>
                      <td data-label="能力">{capabilitiesText(model)}</td>
                      <td data-label="积分价格">{pricingText(model)}</td>
                      <td data-label="状态">
                        <div className={workspace.primaryCell}>
                          <span
                            className={clsx(
                              workspace.status,
                              model.status === "enabled"
                                ? workspace.statusSuccess
                                : workspace.statusWarning,
                            )}
                          >
                            {model.status === "enabled" ? "启用" : "停用"}
                          </span>
                          <span
                            className={clsx(
                              workspace.secondaryText,
                              model.verificationStatus === "verified" &&
                                workspace.statusSuccessText,
                            )}
                          >
                            {verificationLabel(model.verificationStatus)}
                          </span>
                        </div>
                      </td>
                      <td data-label="操作">
                        <div className={workspace.rowActions}>
                          <button
                            className={workspace.iconAction}
                            type="button"
                            title="编辑模型"
                            onClick={() => openEdit(model)}
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          <button
                            className={workspace.iconAction}
                            type="button"
                            title={model.status === "enabled" ? "停用模型" : "启用模型"}
                            onClick={() => toggleStatus(model)}
                          >
                            <CirclePower size={15} aria-hidden="true" />
                          </button>
                          {model.defaultFlag !== 1 ? (
                            <button
                              className={workspace.iconAction}
                              type="button"
                              title="设为默认模型"
                              onClick={() => setDefault(model)}
                            >
                              <Star size={15} aria-hidden="true" />
                            </button>
                          ) : null}
                          <button
                            className={clsx(workspace.iconAction, workspace.textActionDanger)}
                            type="button"
                            title="删除模型"
                            onClick={() => remove(model)}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={workspace.empty}>还没有配置模型</div>
          )}
        </section>
      </>
    );
  }

  return (
    <div className={workspace.workspace}>
      {isEditorOpen ? renderEditor() : renderModelList()}

      {isConnectionPanelOpen ? (
        <div className={workspace.modalLayer} role="presentation">
          <button
            className={workspace.modalBackdrop}
            type="button"
            aria-label="关闭中转站连接"
            onClick={closeConnectionPanel}
          />
          <section className={workspace.connectionPanel} role="dialog" aria-modal="true">
            <header className={workspace.connectionPanelHeader}>
              <div className={workspace.connectionPanelTitleRow}>
                <Link2 size={17} aria-hidden="true" />
                <h2>{connectionPanelMode === "list" ? "中转站连接" : "连接设置"}</h2>
              </div>
              <button
                className={workspace.iconAction}
                type="button"
                title="关闭"
                onClick={closeConnectionPanel}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>

            {connectionPanelMode === "list" ? (
              <>
                <div className={workspace.connectionPanelToolbar}>
                  <span className={workspace.secondaryText}>{connections.length} 个连接</span>
                  <button
                    className={workspace.primaryAction}
                    type="button"
                    onClick={openCreateConnection}
                  >
                    <Plus size={15} aria-hidden="true" />
                    新建连接
                  </button>
                </div>
                {connectionMessage ? (
                  <p className={workspace.inlineMessage}>{connectionMessage}</p>
                ) : null}
                <div className={workspace.connectionList}>
                  {connections.length ? (
                    connections.map((connection) => (
                      <article key={connection.id} className={workspace.connectionItem}>
                        <div className={workspace.connectionItemMain}>
                          <div className={workspace.connectionItemTitle}>
                            <strong>{connection.name}</strong>
                            <span className={workspace.badge}>
                              {adapterLabels[connection.adapter]}
                            </span>
                            <span
                              className={clsx(
                                workspace.status,
                                connection.status === "enabled"
                                  ? workspace.statusSuccess
                                  : workspace.statusWarning,
                              )}
                            >
                              {connection.status === "enabled" ? "启用" : "停用"}
                            </span>
                          </div>
                          <span className={workspace.monoText}>{connection.apiBaseUrl}</span>
                          <span className={workspace.secondaryText}>
                            {connection.hasApiKey ? connection.apiKeyPreview : "未配置 API Key"} ·{" "}
                            {connection.modelCount} 个模型
                          </span>
                        </div>
                        <div className={workspace.rowActions}>
                          <button
                            className={workspace.iconAction}
                            type="button"
                            title="编辑连接"
                            onClick={() => openEditConnection(connection)}
                          >
                            <Pencil size={15} aria-hidden="true" />
                          </button>
                          <button
                            className={clsx(workspace.iconAction, workspace.textActionDanger)}
                            type="button"
                            title="删除连接"
                            onClick={() => removeConnection(connection)}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className={workspace.empty}>还没有中转站连接</div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={workspace.connectionPanelBody}>
                  {connectionMessage ? (
                    <p className={workspace.inlineMessage}>{connectionMessage}</p>
                  ) : null}
                  <div className={workspace.formSection}>
                    <label className={workspace.fieldGroup}>
                      <span className={workspace.fieldLabel}>连接名称</span>
                      <input
                        className={workspace.formField}
                        value={connectionForm.name}
                        maxLength={100}
                        onChange={(event) => updateConnectionForm({ name: event.target.value })}
                      />
                    </label>
                    <label className={workspace.fieldGroup}>
                      <span className={workspace.fieldLabel}>供应商适配器</span>
                      <AppSelect
                        value={connectionForm.adapter}
                        onChange={(adapter) => updateConnectionForm({ adapter })}
                        options={(
                          Object.keys(connectionAdapterLabels) as GenerationModelAdapter[]
                        ).map((adapter) => ({
                          value: adapter,
                          label: connectionAdapterLabels[adapter],
                        }))}
                      />
                    </label>
                    <label className={workspace.fieldGroup}>
                      <span className={workspace.fieldLabel}>中转站地址</span>
                      <input
                        className={workspace.formField}
                        type="url"
                        value={connectionForm.apiBaseUrl}
                        placeholder="https://example.com"
                        onChange={(event) =>
                          updateConnectionForm({ apiBaseUrl: event.target.value })
                        }
                      />
                    </label>
                    <label className={workspace.fieldGroup}>
                      <span className={workspace.fieldLabel}>API Key</span>
                      <input
                        className={workspace.formField}
                        type="password"
                        autoComplete="new-password"
                        value={connectionForm.apiKey}
                        placeholder={connectionForm.id ? "留空保留当前密钥" : "请输入 API Key"}
                        onChange={(event) => updateConnectionForm({ apiKey: event.target.value })}
                      />
                    </label>
                    {connectionForm.id ? (
                      <label className={workspace.optionCheck}>
                        <input
                          type="checkbox"
                          checked={connectionForm.clearApiKey}
                          onChange={(event) =>
                            updateConnectionForm({ clearApiKey: event.target.checked })
                          }
                        />
                        <span>清除当前 API Key</span>
                      </label>
                    ) : null}
                    <label className={workspace.switchRow}>
                      <span>启用连接</span>
                      <input
                        type="checkbox"
                        checked={connectionForm.status === "enabled"}
                        onChange={(event) =>
                          updateConnectionForm({
                            status: event.target.checked ? "enabled" : "disabled",
                          })
                        }
                      />
                    </label>
                  </div>

                  <div className={workspace.connectionDiscoveryBlock}>
                    <div className={workspace.connectionToolbar}>
                      <span className={workspace.fieldLabel}>可用模型</span>
                      <button
                        className={workspace.secondaryAction}
                        type="button"
                        disabled={isConnectionDiscovering}
                        onClick={discoverConnectionForm}
                      >
                        <RefreshCw size={14} aria-hidden="true" />
                        {isConnectionDiscovering ? "拉取中" : "拉取模型"}
                      </button>
                    </div>
                    {connectionDiscoveredModels.length ? (
                      <div className={workspace.discoveredList}>
                        {connectionDiscoveredModels.map((model) => (
                          <button
                            key={model.id}
                            className={workspace.discoveredItem}
                            type="button"
                            disabled={!connectionReturnToModel || !connectionForm.id}
                            onClick={() => selectConnectionDiscoveredModel(model)}
                          >
                            <span>{model.id}</span>
                            <span className={workspace.secondaryText}>
                              {model.ownedBy || model.displayName}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
                <footer className={workspace.connectionPanelFooter}>
                  <button
                    className={workspace.secondaryAction}
                    type="button"
                    onClick={() => setConnectionPanelMode("list")}
                  >
                    返回
                  </button>
                  <button
                    className={workspace.primaryAction}
                    type="button"
                    disabled={isConnectionSaving}
                    onClick={saveConnection}
                  >
                    <Save size={15} aria-hidden="true" />
                    {isConnectionSaving ? "保存中" : "保存连接"}
                  </button>
                </footer>
              </>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function OptionFieldset(props: {
  label: string;
  values: string[];
  selected: string[];
  labels?: Record<string, string>;
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className={workspace.optionFieldset}>
      <legend className={workspace.fieldLabel}>{props.label}</legend>
      <div className={workspace.optionGrid}>
        {props.values.map((value) => (
          <label key={value} className={workspace.optionCheck}>
            <input
              type="checkbox"
              checked={props.selected.includes(value)}
              onChange={() => props.onToggle(value)}
            />
            <span>{props.labels?.[value] ?? value}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
