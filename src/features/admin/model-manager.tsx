"use client";

import clsx from "clsx";
import { ArrowLeft, CirclePower, Pencil, Plus, Save, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { adminModelsApi } from "@/api/admin/models";
import { AppSelect } from "@/components/ui/app-select";
import type {
  AdminGenerationModel,
  GenerationModelAdapter,
  GenerationModelCatalogItem,
  SaveAdminGenerationModelRequest,
} from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import workspace from "./admin-workspace.module.css";

type ModelManagerProps = {
  initialModels: AdminGenerationModel[];
  catalog: GenerationModelCatalogItem[];
};

type FormState = {
  modelCode: string;
  modelType: "image" | "video";
  adapter: GenerationModelAdapter;
  apiBaseUrl: string;
  apiKey: string;
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

type EditorTab = "basic" | "capabilities" | "pricing";
type ListField = "ratios" | "qualities" | "resolutions";

const adapterLabels: Record<GenerationModelAdapter, string> = {
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
};

function stringRecord(values: Record<string, number>) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, String(value)]));
}

function createForm(item: GenerationModelCatalogItem | undefined): FormState {
  return {
    modelCode: item?.modelCode ?? "",
    modelType: item?.modelType ?? "image",
    adapter: item?.adapter ?? "openai",
    apiBaseUrl: item?.defaultApiBaseUrl ?? "",
    apiKey: "",
    status: "enabled",
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
    pointsByQuality: stringRecord(item?.defaultPoints ?? {}),
    pointsPerSecond: stringRecord(item?.defaultPointsPerSecond ?? {}),
    referencePoints: stringRecord(item?.defaultReferencePoints ?? {}),
  };
}

function formFromModel(model: AdminGenerationModel): FormState {
  return {
    modelCode: model.modelCode,
    modelType: model.modelType,
    adapter: model.adapter,
    apiBaseUrl: model.apiBaseUrl,
    apiKey: "",
    status: model.status,
    defaultFlag: model.defaultFlag === 1 ? 1 : 0,
    sortOrder: String(model.sortOrder),
    imageToImageEnabled: model.imageToImageEnabled,
    imageToVideoEnabled: model.imageToVideoEnabled,
    ratios: [...model.supportedRatios],
    qualities: [...model.supportedQualities],
    resolutions: [...model.supportedResolutions],
    minDuration: String(model.minDuration ?? 1),
    maxDuration: String(model.maxDuration ?? 15),
    maxCount: String(model.maxCount),
    pointsByQuality: stringRecord(model.pointsByQuality),
    pointsPerSecond: stringRecord(model.pointsPerSecondByResolution),
    referencePoints: stringRecord(model.referencePointsByResolution),
  };
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

export function ModelManager({ initialModels, catalog }: ModelManagerProps) {
  const [models, setModels] = useState(initialModels);
  const [form, setForm] = useState(() => createForm(catalog[0]));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<EditorTab>("basic");
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const selectedCatalog = useMemo(
    () => catalog.find((item) => item.modelCode === form.modelCode),
    [catalog, form.modelCode],
  );
  const configuredCodes = useMemo(() => new Set(models.map((model) => model.modelCode)), [models]);
  const isVideo = form.modelType === "video";

  function updateForm(patch: Partial<FormState>) {
    setForm((current) => ({ ...current, ...patch }));
  }

  function openCreate() {
    const firstAvailable =
      catalog.find((item) => !configuredCodes.has(item.modelCode)) ?? catalog[0];
    setEditingId(null);
    setForm(createForm(firstAvailable));
    setActiveTab("basic");
    setMessage("");
    setEditorOpen(true);
  }

  function openEdit(model: AdminGenerationModel) {
    setEditingId(model.id);
    setForm(formFromModel(model));
    setActiveTab("basic");
    setMessage("");
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditingId(null);
    setMessage("");
  }

  function selectModel(modelCode: string) {
    const item = catalog.find((entry) => entry.modelCode === modelCode);
    if (item) {
      setForm(createForm(item));
    }
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

  function buildPayload(): SaveAdminGenerationModelRequest {
    if (!selectedCatalog) {
      throw new Error("请选择预置模型");
    }
    const base = {
      modelCode: form.modelCode,
      adapter: form.adapter,
      apiBaseUrl: form.apiBaseUrl.trim(),
      apiKey: form.apiKey.trim(),
      clearApiKey: false,
      status: form.status,
      defaultFlag: form.defaultFlag,
      sortOrder: readInteger(form.sortOrder, "排序"),
      ratios: form.ratios,
    };

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
      if (!editingId && !form.apiKey.trim()) {
        throw new Error("新建模型时必须填写 API Key");
      }
      if (form.ratios.length === 0) {
        throw new Error("至少选择一个比例");
      }
      if (!isVideo && form.qualities.length === 0) {
        throw new Error("至少选择一个画质档位");
      }
      if (isVideo && form.resolutions.length === 0) {
        throw new Error("至少选择一个视频分辨率");
      }
      const result = editingId
        ? await adminModelsApi.update(editingId, buildPayload())
        : await adminModelsApi.create(buildPayload());
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

  if (isEditorOpen) {
    return (
      <div className={workspace.workspace}>
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
                    <span className={workspace.fieldLabel}>模型</span>
                    <AppSelect
                      value={form.modelCode}
                      disabled={Boolean(editingId)}
                      onChange={selectModel}
                      options={catalog.map((item) => ({
                        value: item.modelCode,
                        label: `${item.modelName} · ${modelTypeLabels[item.modelType]}`,
                        disabled: !editingId && configuredCodes.has(item.modelCode),
                      }))}
                    />
                  </div>
                  <div className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>供应商适配器</span>
                    <AppSelect
                      value={form.adapter}
                      onChange={(adapter) => updateForm({ adapter })}
                      options={(["openai", "grok"] as const).map((adapter) => ({
                        value: adapter,
                        label: adapterLabels[adapter],
                        disabled: adapter !== selectedCatalog?.adapter,
                      }))}
                    />
                  </div>
                  <label className={clsx(workspace.fieldGroup, workspace.fieldGroupFull)}>
                    <span className={workspace.fieldLabel}>API 地址</span>
                    <input
                      className={workspace.formField}
                      type="url"
                      value={form.apiBaseUrl}
                      onChange={(event) => updateForm({ apiBaseUrl: event.target.value })}
                    />
                  </label>
                  <label className={clsx(workspace.fieldGroup, workspace.fieldGroupFull)}>
                    <span className={workspace.fieldLabel}>API Key</span>
                    <input
                      className={workspace.formField}
                      type="password"
                      autoComplete="new-password"
                      placeholder={editingId ? "留空保留当前密钥" : "请输入 API Key"}
                      value={form.apiKey}
                      onChange={(event) => updateForm({ apiKey: event.target.value })}
                    />
                  </label>
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
                <div className={workspace.switches}>
                  <label className={workspace.switchRow}>
                    <span>启用模型</span>
                    <input
                      type="checkbox"
                      checked={form.status === "enabled"}
                      onChange={(event) =>
                        updateForm({ status: event.target.checked ? "enabled" : "disabled" })
                      }
                    />
                  </label>
                  <label className={workspace.switchRow}>
                    <span>默认模型</span>
                    <input
                      type="checkbox"
                      checked={form.defaultFlag === 1}
                      onChange={(event) =>
                        updateForm({ defaultFlag: event.target.checked ? 1 : 0 })
                      }
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
                        ? !selectedCatalog?.imageToVideoSupported
                        : !selectedCatalog?.imageToImageSupported
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
                  values={selectedCatalog?.ratios ?? []}
                  selected={form.ratios}
                  onToggle={(value) => toggleListValue("ratios", value)}
                />
                {isVideo ? (
                  <>
                    <OptionFieldset
                      label="支持分辨率"
                      values={selectedCatalog?.resolutions ?? []}
                      selected={form.resolutions}
                      onToggle={(value) => toggleListValue("resolutions", value)}
                    />
                    <div className={workspace.formGrid}>
                      <label className={workspace.fieldGroup}>
                        <span className={workspace.fieldLabel}>最短时长（秒）</span>
                        <input
                          className={workspace.formField}
                          type="number"
                          min={selectedCatalog?.minDuration ?? 1}
                          max={selectedCatalog?.maxDuration ?? 15}
                          value={form.minDuration}
                          onChange={(event) => updateForm({ minDuration: event.target.value })}
                        />
                      </label>
                      <label className={workspace.fieldGroup}>
                        <span className={workspace.fieldLabel}>最长时长（秒）</span>
                        <input
                          className={workspace.formField}
                          type="number"
                          min={selectedCatalog?.minDuration ?? 1}
                          max={selectedCatalog?.maxDuration ?? 15}
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
                      values={selectedCatalog?.qualities ?? []}
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
                        max={selectedCatalog?.maxCount ?? 1}
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
      </div>
    );
  }

  return (
    <div className={workspace.workspace}>
      <header className={workspace.header}>
        <h1 className="page-title">模型配置</h1>
        <button
          className={workspace.primaryAction}
          type="button"
          onClick={openCreate}
          disabled={catalog.length === 0 || configuredCodes.size >= catalog.length}
        >
          <Plus size={15} aria-hidden="true" />
          新建模型
        </button>
      </header>
      {message ? <p className={workspace.inlineMessage}>{message}</p> : null}
      <section className={workspace.panel}>
        {models.length ? (
          <div className={workspace.tableWrap}>
            <table className={clsx(workspace.table, workspace.modelsTable)}>
              <thead>
                <tr>
                  <th>模型</th>
                  <th>适配器</th>
                  <th>能力</th>
                  <th>积分价格</th>
                  <th>状态</th>
                  <th>排序</th>
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
                      </div>
                    </td>
                    <td data-label="适配器">{adapterLabels[model.adapter]}</td>
                    <td data-label="能力">{capabilitiesText(model)}</td>
                    <td data-label="积分价格">{pricingText(model)}</td>
                    <td data-label="状态">
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
                    </td>
                    <td data-label="排序" className={workspace.numeric}>
                      {model.sortOrder}
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
