"use client";

import clsx from "clsx";
import { ArrowLeft, Check, Plus, RefreshCw, Save } from "lucide-react";
import { useState } from "react";
import { adminModelsApi } from "@/api/admin/models";
import { AppSelect } from "@/components/ui/app-select";
import type {
  AdminGenerationModel,
  DiscoveredProviderModel,
  GenerationModelCatalogItem,
  GenerationProviderConnection,
  SaveModelRequest,
} from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import { Affix, ChipGroup, Field, SwitchRow } from "./admin-form";
import workspace from "./admin-workspace.module.css";
import { adapterLabels, ProviderConnectionPanel } from "./provider-connection-panel";
import type { ConnectionSaveResult, DiscoveryState } from "./provider-connection-panel";

type ModelFormProps = {
  model: AdminGenerationModel | null;
  catalog: GenerationModelCatalogItem[];
  connections: GenerationProviderConnection[];
  onSaved: (model: AdminGenerationModel) => void;
  onClose: () => void;
  onConnectionSaved: (connection: GenerationProviderConnection, isConfigChanged: boolean) => void;
  onConnectionRemoved: (connection: GenerationProviderConnection) => void;
};

type FormState = {
  modelType: "image" | "video";
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
  inpaintEnabled: boolean;
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

type EditorTab = "basic" | "capabilities" | "pricing";
type ListField = "ratios" | "qualities" | "resolutions";
type PriceField = "pointsByQuality" | "pointsPerSecond" | "referencePoints";

const tabs: { value: EditorTab; label: string }[] = [
  { value: "basic", label: "基本信息" },
  { value: "capabilities", label: "用户能力" },
  { value: "pricing", label: "积分价格" },
];

const modelTypeLabels = {
  image: "图片",
  video: "视频",
} as const;

const qualityLabels: Record<string, string> = {
  low: "1K",
  medium: "2K",
  high: "4K",
  auto: "自动",
  standard: "标准",
};

function stringRecord(values: Record<string, number> | undefined) {
  return Object.fromEntries(
    Object.entries(values ?? {}).map(([key, value]) => [key, String(value)]),
  );
}

function createForm(item: GenerationModelCatalogItem | undefined): FormState {
  return {
    modelType: item?.modelType ?? "image",
    connectionId: "",
    providerModelCode: "",
    modelName: item?.modelName ?? "",
    capabilityProfile: item?.capabilityProfile ?? "",
    verificationStatus: "unverified",
    status: "disabled",
    defaultFlag: 0,
    sortOrder: "10",
    imageToImageEnabled: item?.imageToImageSupported ?? false,
    imageToVideoEnabled: item?.imageToVideoSupported ?? false,
    inpaintEnabled: false,
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
    modelType: model.modelType,
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
    inpaintEnabled: model.inpaintEnabled,
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
    modelType: profile.modelType,
    capabilityProfile: profile.capabilityProfile,
    imageToImageEnabled: profile.imageToImageSupported,
    imageToVideoEnabled: profile.imageToVideoSupported,
    inpaintEnabled: false,
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
  adapter: GenerationProviderConnection["adapter"],
) {
  const sameProfile = catalog.find((item) => {
    return (
      item.capabilityProfile === form.capabilityProfile &&
      item.modelType === form.modelType &&
      item.adapter === adapter
    );
  });
  if (sameProfile) {
    return sameProfile;
  }

  const sameType = catalog.find((item) => {
    return item.modelType === form.modelType && item.adapter === adapter;
  });
  return sameType ?? null;
}

function readInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${label}必须是整数`);
  }
  return parsed;
}

export function ModelForm(props: ModelFormProps) {
  const model = props.model;
  const catalog = props.catalog;
  const connections = props.connections;
  const onSaved = props.onSaved;
  const onClose = props.onClose;
  const onConnectionSaved = props.onConnectionSaved;
  const onConnectionRemoved = props.onConnectionRemoved;
  const editingId = model?.id ?? null;

  const [form, setForm] = useState(() => {
    if (model) {
      return formFromModel(model, catalog);
    }
    return createForm(catalog[0]);
  });
  const [activeTab, setActiveTab] = useState<EditorTab>("basic");
  const [isSaving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [discovered, setDiscovered] = useState<DiscoveredProviderModel[]>([]);
  const [discoveredConnectionId, setDiscoveredConnectionId] = useState<string | null>(null);
  const [discoveryState, setDiscoveryState] = useState<DiscoveryState>("idle");
  const [isDiscovering, setDiscovering] = useState(false);
  const [isPanelOpen, setPanelOpen] = useState(false);

  const selectedConnection = connections.find((item) => item.id === form.connectionId) ?? null;
  const profile = catalog.find((item) => item.capabilityProfile === form.capabilityProfile) ?? null;
  const isVideo = form.modelType === "video";
  const isVerified = form.verificationStatus === "verified";
  const isCurrentDiscovery =
    discoveryState === "success" && discoveredConnectionId === form.connectionId;
  const discoveredForConnection = isCurrentDiscovery ? discovered : [];
  const canEnterManually = discoveryState === "empty" || discoveryState === "error";

  function updateForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function resetDiscovery() {
    setDiscovered([]);
    setDiscoveredConnectionId(null);
    setDiscoveryState("idle");
  }

  function selectProfile(profileCode: string) {
    const nextProfile = catalog.find((item) => item.capabilityProfile === profileCode);
    if (!nextProfile) {
      return;
    }
    setForm((current) => applyProfile(current, nextProfile));
    resetDiscovery();
  }

  function selectConnection(connectionId: string) {
    const connection = connections.find((item) => item.id === connectionId);
    if (!connection) {
      updateForm({
        connectionId: "",
        providerModelCode: "",
        verificationStatus: "unverified",
        status: "disabled",
        defaultFlag: 0,
      });
      return;
    }

    const compatible = compatibleProfile(catalog, form, connection.adapter);
    const isSameConnection = form.connectionId === connectionId;

    if (!compatible) {
      updateForm({
        connectionId,
        providerModelCode: "",
        capabilityProfile: "",
        verificationStatus: "unverified",
        status: "disabled",
        defaultFlag: 0,
      });
    } else if (
      compatible.capabilityProfile !== form.capabilityProfile ||
      compatible.modelType !== form.modelType
    ) {
      setForm((current) => {
        const base = { ...current, connectionId, providerModelCode: "" };
        return applyProfile(base, compatible);
      });
    } else if (!isSameConnection) {
      updateForm({
        connectionId,
        providerModelCode: "",
        verificationStatus: "unverified",
        status: "disabled",
        defaultFlag: 0,
      });
    }
    resetDiscovery();
  }

  function selectProviderModel(providerModelCode: string) {
    const isListed = discoveredForConnection.some((item) => item.id === providerModelCode);
    const isVerifiedPick = isListed && !canEnterManually;
    updateForm({
      providerModelCode,
      verificationStatus: isVerifiedPick ? "verified" : "unverified",
      status: isVerifiedPick ? form.status : "disabled",
      defaultFlag: isVerifiedPick ? form.defaultFlag : 0,
    });
  }

  function toggleListValue(field: ListField, value: string) {
    setForm((current) => {
      const values = current[field];
      let next = [...values, value];
      if (values.includes(value)) {
        next = values.filter((item) => item !== value);
      }
      return { ...current, [field]: next };
    });
  }

  function updatePrice(field: PriceField, key: string, value: string) {
    setForm((current) => ({ ...current, [field]: { ...current[field], [key]: value } }));
  }

  async function discoverConnection() {
    if (!form.connectionId) {
      setMessage("请先选择中转站连接");
      return;
    }

    const connectionId = form.connectionId;
    setDiscovering(true);
    setMessage("");
    setDiscoveryState("idle");
    setDiscovered([]);
    try {
      const models = await adminModelsApi.discoverSaved(connectionId);
      setDiscovered(models);
      setDiscoveredConnectionId(connectionId);
      setDiscoveryState(models.length > 0 ? "success" : "empty");
      const isListed = models.some((item) => item.id === form.providerModelCode.trim());
      if (isListed) {
        updateForm({ verificationStatus: "verified" });
      } else {
        updateForm({
          providerModelCode: models.length > 0 ? "" : form.providerModelCode,
          verificationStatus: "unverified",
          status: "disabled",
          defaultFlag: 0,
        });
        if (models.length === 0) {
          setMessage("中转站没有返回可用模型");
        }
      }
    } catch (error) {
      setDiscovered([]);
      setDiscoveredConnectionId(connectionId);
      setDiscoveryState("error");
      updateForm({ verificationStatus: "unverified", status: "disabled", defaultFlag: 0 });
      setMessage(getErrorMessage(error));
    } finally {
      setDiscovering(false);
    }
  }

  function buildPayload(): SaveModelRequest {
    if (!selectedConnection) {
      throw new Error("请选择中转站连接");
    }
    if (!profile) {
      throw new Error("请选择能力模板");
    }
    const providerModelCode = form.providerModelCode.trim();
    if (!providerModelCode) {
      throw new Error("请选择或填写供应商模型 ID");
    }

    const isListed = discoveredForConnection.some((item) => item.id === providerModelCode);
    const isModelVerified = !canEnterManually && (isVerified || isListed);
    const base = {
      connectionId: selectedConnection.id,
      providerModelCode,
      modelName: form.modelName.trim() || profile.modelName,
      capabilityProfile: profile.capabilityProfile,
      status: isModelVerified ? form.status : "disabled",
      defaultFlag: isModelVerified ? form.defaultFlag : 0,
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
        inpaintEnabled: form.inpaintEnabled,
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
      let saved: AdminGenerationModel;
      if (editingId) {
        saved = await adminModelsApi.update(editingId, payload);
      } else {
        saved = await adminModelsApi.create(payload);
      }
      onSaved(saved);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function closePanel() {
    setPanelOpen(false);
    resetDiscovery();
  }

  function applySavedConnection(result: ConnectionSaveResult) {
    const connection = result.connection;
    onConnectionSaved(connection, result.isConfigChanged);

    // 第一步：沿用连接面板或当前表单里已有的拉取结果；配置变化后全部作废。
    const isFormDiscovery =
      Boolean(form.connectionId) &&
      form.connectionId === result.editedId &&
      discoveredConnectionId === form.connectionId;
    let nextState = result.discoveryState;
    let nextModels = result.discoveredModels;
    if (nextState === "idle" && isFormDiscovery) {
      nextState = discoveryState;
      nextModels = discovered;
    }
    if (result.isConfigChanged) {
      nextState = "idle";
      nextModels = [];
    }

    // 第二步：推导绑定新连接后的验证、启用与默认状态。
    const canKeepCode = Boolean(result.editedId) && form.connectionId === connection.id;
    const providerModelCode = canKeepCode ? form.providerModelCode : "";
    const isListed = nextModels.some((item) => item.id === providerModelCode.trim());
    let verificationStatus: FormState["verificationStatus"] = "unverified";
    if (!result.isConfigChanged && isListed) {
      verificationStatus = "verified";
    } else if (!result.isConfigChanged && canKeepCode) {
      verificationStatus = form.verificationStatus;
    }
    const isUsable = connection.status === "enabled" && verificationStatus === "verified";
    const status = isUsable ? form.status : "disabled";
    const defaultFlag = status === "enabled" && isUsable ? form.defaultFlag : 0;

    // 第三步：模板与新连接的适配器不一致时切换到兼容模板。
    const nextProfile = compatibleProfile(catalog, form, connection.adapter);
    const isSameProfile =
      nextProfile?.capabilityProfile === form.capabilityProfile &&
      nextProfile?.modelType === form.modelType;
    const base: FormState = {
      ...form,
      connectionId: connection.id,
      providerModelCode,
      verificationStatus,
      status,
      defaultFlag,
    };
    if (!nextProfile || isSameProfile) {
      setForm(base);
    } else {
      const reset = applyProfile(base, nextProfile);
      setForm({ ...reset, providerModelCode, verificationStatus, status, defaultFlag });
    }

    setDiscovered(nextModels);
    const hasDiscovery = nextModels.length > 0 || nextState !== "idle";
    setDiscoveredConnectionId(hasDiscovery ? connection.id : null);
    setDiscoveryState(nextState);
    setPanelOpen(false);
  }

  function removeConnection(connection: GenerationProviderConnection) {
    onConnectionRemoved(connection);
    if (form.connectionId === connection.id) {
      updateForm({
        connectionId: "",
        providerModelCode: "",
        verificationStatus: "unverified",
        status: "disabled",
        defaultFlag: 0,
      });
    }
  }

  function pickModel(
    connectionId: string,
    picked: DiscoveredProviderModel,
    models: DiscoveredProviderModel[],
  ) {
    updateForm({ connectionId, providerModelCode: picked.id, verificationStatus: "verified" });
    setDiscovered(models);
    setDiscoveredConnectionId(connectionId);
    setDiscoveryState("success");
    setPanelOpen(false);
  }

  function renderProviderModelControl() {
    if (discoveredForConnection.length) {
      return (
        <AppSelect
          value={form.providerModelCode}
          onChange={selectProviderModel}
          placeholder="从可用模型中选择"
          triggerClassName={workspace.selectTrigger}
          options={discoveredForConnection.map((item) => ({
            value: item.id,
            label: item.ownedBy ? `${item.id} · ${item.ownedBy}` : item.id,
          }))}
        />
      );
    }

    if (canEnterManually) {
      return (
        <input
          className={workspace.formField}
          value={form.providerModelCode}
          maxLength={200}
          placeholder="请输入供应商模型 ID"
          onChange={(event) => selectProviderModel(event.target.value)}
        />
      );
    }

    return (
      <input
        className={workspace.formField}
        value={form.providerModelCode}
        readOnly
        placeholder="请先拉取可用模型"
        aria-label="供应商模型 ID"
      />
    );
  }

  function renderProfileSummary() {
    const options = catalog.filter((item) => {
      return !selectedConnection || item.adapter === selectedConnection.adapter;
    });
    const canChoose = !editingId && options.length > 1;

    return (
      <div className={workspace.summary}>
        <span className={workspace.summaryItem}>
          <span>能力模板</span>
          {canChoose ? (
            options.map((item) => (
              <button
                key={item.capabilityProfile}
                className={clsx(
                  workspace.chip,
                  item.capabilityProfile === form.capabilityProfile && workspace.chipActive,
                )}
                type="button"
                aria-pressed={item.capabilityProfile === form.capabilityProfile}
                onClick={() => selectProfile(item.capabilityProfile)}
              >
                {item.capabilityProfile === form.capabilityProfile ? (
                  <Check size={13} aria-hidden="true" />
                ) : null}
                {item.modelName}
              </button>
            ))
          ) : (
            <strong>{profile?.modelName ?? (form.capabilityProfile || "未选择")}</strong>
          )}
        </span>
        <span className={workspace.summaryItem}>
          <span>模型类型</span>
          <strong>{modelTypeLabels[form.modelType]}</strong>
        </span>
        {profile ? (
          <span className={workspace.summaryItem}>
            <span>适配器</span>
            <strong>{adapterLabels[profile.adapter]}</strong>
          </span>
        ) : null}
      </div>
    );
  }

  function renderBasic() {
    let connectionHint: string | undefined;
    if (selectedConnection) {
      const key = selectedConnection.hasApiKey ? selectedConnection.apiKeyPreview : "未配置密钥";
      connectionHint = `${selectedConnection.apiBaseUrl} · ${key}`;
    }

    return (
      <div className={workspace.formSection}>
        {renderProfileSummary()}
        <div className={workspace.formGrid}>
          <Field label="中转站连接" hint={connectionHint} isGroup>
            <div className={workspace.fieldWithAction}>
              <AppSelect
                value={form.connectionId}
                onChange={selectConnection}
                placeholder="请选择连接"
                triggerClassName={workspace.selectTrigger}
                options={connections.map((connection) => ({
                  value: connection.id,
                  label: `${connection.name} · ${adapterLabels[connection.adapter]}`,
                }))}
              />
              <button
                className={workspace.iconAction}
                type="button"
                title="新建连接"
                aria-label="新建连接"
                onClick={() => setPanelOpen(true)}
              >
                <Plus size={15} aria-hidden="true" />
              </button>
            </div>
          </Field>

          <Field label="展示名称">
            <input
              className={workspace.formField}
              value={form.modelName}
              maxLength={100}
              onChange={(event) => updateForm({ modelName: event.target.value })}
            />
          </Field>

          <Field label="供应商模型 ID" isGroup>
            <div className={workspace.fieldWithAction}>
              {renderProviderModelControl()}
              <button
                className={workspace.secondaryAction}
                type="button"
                disabled={!form.connectionId || isDiscovering}
                onClick={discoverConnection}
              >
                <RefreshCw size={14} aria-hidden="true" />
                {isDiscovering ? "拉取中" : "拉取可用模型"}
              </button>
            </div>
          </Field>

          <Field label="排序">
            <input
              className={workspace.formField}
              type="number"
              value={form.sortOrder}
              onChange={(event) => updateForm({ sortOrder: event.target.value })}
            />
          </Field>
        </div>

        <div className={workspace.switchList}>
          <div className={workspace.switchRow}>
            <span>验证状态</span>
            <span
              className={clsx(
                workspace.status,
                isVerified ? workspace.statusSuccess : workspace.statusWarning,
              )}
            >
              {isVerified ? "已验证" : "未验证"}
            </span>
          </div>
          <SwitchRow
            label="启用模型"
            hint={isVerified ? undefined : "拉取并选择可用模型后才能启用"}
            checked={form.status === "enabled"}
            disabled={!isVerified}
            onChange={(checked) =>
              updateForm({
                status: checked ? "enabled" : "disabled",
                defaultFlag: checked ? form.defaultFlag : 0,
              })
            }
          />
          <SwitchRow
            label="默认模型"
            checked={form.defaultFlag === 1}
            disabled={!isVerified || form.status !== "enabled"}
            onChange={(checked) => updateForm({ defaultFlag: checked ? 1 : 0 })}
          />
        </div>
      </div>
    );
  }

  function renderCapabilities() {
    const unsupported = "当前模板不支持";
    const ratioOptions = (profile?.ratios ?? []).map((value) => ({ value, label: value }));

    if (isVideo) {
      const resolutionOptions = (profile?.resolutions ?? []).map((value) => ({
        value,
        label: value,
      }));
      const isSupported = profile?.imageToVideoSupported === true;
      const durationHint = `${profile?.minDuration ?? 1} – ${profile?.maxDuration ?? 15}`;

      return (
        <div className={workspace.formSection}>
          <div className={workspace.switchList}>
            <SwitchRow
              label="图生视频"
              hint={isSupported ? undefined : unsupported}
              checked={form.imageToVideoEnabled}
              disabled={!isSupported}
              onChange={(checked) => updateForm({ imageToVideoEnabled: checked })}
            />
          </div>
          <ChipGroup
            label="支持比例"
            options={ratioOptions}
            selected={form.ratios}
            onToggle={(value) => toggleListValue("ratios", value)}
          />
          <ChipGroup
            label="支持分辨率"
            options={resolutionOptions}
            selected={form.resolutions}
            onToggle={(value) => toggleListValue("resolutions", value)}
          />
          <div className={clsx(workspace.formGrid, workspace.formGridNarrow)}>
            <Field label="最短时长" hint={durationHint}>
              <Affix suffix="秒">
                <input
                  type="number"
                  min={profile?.minDuration ?? 1}
                  max={profile?.maxDuration ?? 15}
                  value={form.minDuration}
                  onChange={(event) => updateForm({ minDuration: event.target.value })}
                />
              </Affix>
            </Field>
            <Field label="最长时长" hint={durationHint}>
              <Affix suffix="秒">
                <input
                  type="number"
                  min={profile?.minDuration ?? 1}
                  max={profile?.maxDuration ?? 15}
                  value={form.maxDuration}
                  onChange={(event) => updateForm({ maxDuration: event.target.value })}
                />
              </Affix>
            </Field>
          </div>
        </div>
      );
    }

    const qualityOptions = (profile?.qualities ?? []).map((value) => ({
      value,
      label: qualityLabels[value] ?? value,
    }));
    const canImageToImage = profile?.imageToImageSupported === true;
    const canInpaint = profile?.inpaintSupported === true;

    return (
      <div className={workspace.formSection}>
        <div className={workspace.switchList}>
          <SwitchRow
            label="图生图"
            hint={canImageToImage ? undefined : unsupported}
            checked={form.imageToImageEnabled}
            disabled={!canImageToImage}
            onChange={(checked) => updateForm({ imageToImageEnabled: checked })}
          />
          <SwitchRow
            label="局部重绘"
            hint={canInpaint ? undefined : unsupported}
            checked={form.inpaintEnabled}
            disabled={!canInpaint}
            onChange={(checked) => updateForm({ inpaintEnabled: checked })}
          />
        </div>
        <ChipGroup
          label="支持比例"
          options={ratioOptions}
          selected={form.ratios}
          onToggle={(value) => toggleListValue("ratios", value)}
        />
        <ChipGroup
          label="画质档位"
          options={qualityOptions}
          selected={form.qualities}
          onToggle={(value) => toggleListValue("qualities", value)}
        />
        <div className={clsx(workspace.formGrid, workspace.formGridNarrow)}>
          <Field label="最大生成数量" hint={`1 – ${profile?.maxCount ?? 1}`}>
            <Affix suffix="张">
              <input
                type="number"
                min={1}
                max={profile?.maxCount ?? 1}
                value={form.maxCount}
                onChange={(event) => updateForm({ maxCount: event.target.value })}
              />
            </Affix>
          </Field>
        </div>
      </div>
    );
  }

  function renderPricing() {
    if (isVideo) {
      return (
        <div className={workspace.formSection}>
          {form.resolutions.length ? null : <p className={workspace.formMessage}>未选择分辨率</p>}
          {form.resolutions.map((resolution) => (
            <div key={resolution} className={clsx(workspace.formGrid, workspace.formGridNarrow)}>
              <Field label={`${resolution} 每秒`}>
                <Affix suffix="积分 / 秒">
                  <input
                    type="number"
                    min={0}
                    value={form.pointsPerSecond[resolution] ?? ""}
                    onChange={(event) =>
                      updatePrice("pointsPerSecond", resolution, event.target.value)
                    }
                  />
                </Affix>
              </Field>
              <Field label={`${resolution} 参考图`}>
                <Affix suffix="积分">
                  <input
                    type="number"
                    min={0}
                    value={form.referencePoints[resolution] ?? ""}
                    onChange={(event) =>
                      updatePrice("referencePoints", resolution, event.target.value)
                    }
                  />
                </Affix>
              </Field>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className={workspace.formSection}>
        {form.qualities.length ? null : <p className={workspace.formMessage}>未选择画质档位</p>}
        <div className={clsx(workspace.formGrid, workspace.formGridNarrow)}>
          {form.qualities.map((quality) => (
            <Field key={quality} label={qualityLabels[quality] ?? quality}>
              <Affix suffix="积分 / 张">
                <input
                  type="number"
                  min={0}
                  value={form.pointsByQuality[quality] ?? ""}
                  onChange={(event) => updatePrice("pointsByQuality", quality, event.target.value)}
                />
              </Affix>
            </Field>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className={workspace.editor}>
      <header className={workspace.editorHeader}>
        <div>
          <button className={workspace.editorBack} type="button" onClick={onClose}>
            <ArrowLeft size={14} aria-hidden="true" />
            返回模型列表
          </button>
          <h1 className={workspace.editorTitle}>{editingId ? "编辑模型" : "新建模型"}</h1>
        </div>
        <div className={workspace.editorActions}>
          <button className={workspace.secondaryAction} type="button" onClick={onClose}>
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
        {tabs.map((tab) => (
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
        {activeTab === "basic" ? renderBasic() : null}
        {activeTab === "capabilities" ? renderCapabilities() : null}
        {activeTab === "pricing" ? renderPricing() : null}
      </div>

      {isPanelOpen ? (
        <ProviderConnectionPanel
          connections={connections}
          initialMode="edit"
          canPickModel
          onClose={closePanel}
          onSaved={applySavedConnection}
          onRemoved={removeConnection}
          onPick={pickModel}
        />
      ) : null}
    </section>
  );
}

export { modelTypeLabels, qualityLabels };
