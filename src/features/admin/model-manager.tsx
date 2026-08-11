"use client";

import clsx from "clsx";
import { ArrowLeft, CirclePower, Pencil, Plus, Save, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { adminModelsApi } from "@/api/admin/models";
import { AppSelect } from "@/components/ui/app-select";
import type {
  AdminGenerationModel,
  ImageModelAdapter,
  ImageModelCatalogItem,
  SaveAdminGenerationModelRequest,
} from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import workspace from "./admin-workspace.module.css";

type ModelManagerProps = {
  initialModels: AdminGenerationModel[];
  catalog: ImageModelCatalogItem[];
};

type FormState = {
  modelCode: string;
  adapter: ImageModelAdapter;
  apiBaseUrl: string;
  apiKey: string;
  status: "enabled" | "disabled";
  defaultFlag: 0 | 1;
  sortOrder: string;
  imageToImageEnabled: boolean;
  ratios: string[];
  qualities: string[];
  maxCount: string;
  pointsByQuality: Record<string, string>;
};

type EditorTab = "basic" | "capabilities" | "pricing";

const adapterLabels: Record<ImageModelAdapter, string> = {
  openai: "OpenAI",
  grok: "Grok",
};

const qualityLabels: Record<string, string> = {
  low: "低",
  medium: "中",
  high: "高",
};

function createForm(item: ImageModelCatalogItem | undefined): FormState {
  return {
    modelCode: item?.modelCode ?? "",
    adapter: item?.adapter ?? "openai",
    apiBaseUrl: item?.defaultApiBaseUrl ?? "",
    apiKey: "",
    status: "enabled",
    defaultFlag: 0,
    sortOrder: "10",
    imageToImageEnabled: item?.imageToImageSupported ?? false,
    ratios: item?.ratios ?? [],
    qualities: item?.qualities ?? [],
    maxCount: String(item?.maxCount ?? 1),
    pointsByQuality: Object.fromEntries(
      Object.entries(item?.defaultPoints ?? {}).map(([quality, points]) => [
        quality,
        String(points),
      ]),
    ),
  };
}

function formFromModel(model: AdminGenerationModel): FormState {
  return {
    modelCode: model.modelCode,
    adapter: model.adapter,
    apiBaseUrl: model.apiBaseUrl,
    apiKey: "",
    status: model.status,
    defaultFlag: model.defaultFlag === 1 ? 1 : 0,
    sortOrder: String(model.sortOrder),
    imageToImageEnabled: model.imageToImageEnabled,
    ratios: model.supportedRatios,
    qualities: model.supportedQualities,
    maxCount: String(model.maxCount),
    pointsByQuality: Object.fromEntries(
      Object.entries(model.pointsByQuality).map(([quality, points]) => [quality, String(points)]),
    ),
  };
}

function readInteger(value: string, label: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) throw new Error(`${label}必须是整数`);
  return parsed;
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
    if (item) setForm(createForm(item));
  }

  function toggleListValue(field: "ratios" | "qualities", value: string) {
    setForm((current) => {
      const values = current[field];
      const next = values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value];
      return { ...current, [field]: next };
    });
  }

  function buildPayload(): SaveAdminGenerationModelRequest {
    if (!selectedCatalog) throw new Error("请选择预置模型");
    const qualityPrices = form.qualities.map((quality) => ({
      quality,
      points: readInteger(
        form.pointsByQuality[quality] ?? "",
        `${qualityLabels[quality] ?? quality}画质积分`,
      ),
    }));
    if (qualityPrices.some((item) => item.points < 0)) throw new Error("积分不能小于 0");

    return {
      modelCode: form.modelCode,
      adapter: form.adapter,
      apiBaseUrl: form.apiBaseUrl.trim(),
      apiKey: form.apiKey.trim(),
      clearApiKey: false,
      status: form.status,
      defaultFlag: form.defaultFlag,
      sortOrder: readInteger(form.sortOrder, "排序"),
      imageToImageEnabled: form.imageToImageEnabled,
      ratios: form.ratios,
      qualities: form.qualities,
      maxCount: readInteger(form.maxCount, "最大生成数量"),
      qualityPrices,
    };
  }

  function replaceModel(model: AdminGenerationModel) {
    setModels((current) => {
      const found = current.some((item) => item.id === model.id);
      const next = found
        ? current.map((item) => (item.id === model.id ? model : item))
        : [...current, model];
      return next.map((item) =>
        model.defaultFlag === 1 && item.id !== model.id ? { ...item, defaultFlag: 0 } : item,
      );
    });
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      if (!editingId && !form.apiKey.trim()) throw new Error("新建模型时必须填写 API Key");
      if (form.ratios.length === 0) throw new Error("至少选择一个图片比例");
      if (form.qualities.length === 0) throw new Error("至少选择一个画质档位");
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
    if (!window.confirm(`确定删除模型“${model.modelName}”吗？`)) return;
    try {
      await adminModelsApi.remove(model.id);
      setModels((current) => current.filter((item) => item.id !== model.id));
      if (editingId === model.id) closeEditor();
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
                        label: item.modelName,
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
                      inputMode="numeric"
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
                  <span>图生图</span>
                  <input
                    type="checkbox"
                    disabled={!selectedCatalog?.imageToImageSupported}
                    checked={form.imageToImageEnabled}
                    onChange={(event) => updateForm({ imageToImageEnabled: event.target.checked })}
                  />
                </label>
                <fieldset className={workspace.optionFieldset}>
                  <legend className={workspace.fieldLabel}>支持比例</legend>
                  <div className={workspace.optionGrid}>
                    {selectedCatalog?.ratios.map((ratio) => (
                      <label key={ratio} className={workspace.optionCheck}>
                        <input
                          type="checkbox"
                          checked={form.ratios.includes(ratio)}
                          onChange={() => toggleListValue("ratios", ratio)}
                        />
                        <span>{ratio}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset className={workspace.optionFieldset}>
                  <legend className={workspace.fieldLabel}>质量档位</legend>
                  <div className={workspace.optionGrid}>
                    {selectedCatalog?.qualities.map((quality) => (
                      <label key={quality} className={workspace.optionCheck}>
                        <input
                          type="checkbox"
                          checked={form.qualities.includes(quality)}
                          onChange={() => toggleListValue("qualities", quality)}
                        />
                        <span>{qualityLabels[quality] ?? quality}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
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
              </div>
            ) : null}

            {activeTab === "pricing" ? (
              <div className={workspace.pricingList}>
                {form.qualities.map((quality) => (
                  <label key={quality} className={workspace.pricingRow}>
                    <span>{qualityLabels[quality] ?? quality}</span>
                    <span className={workspace.priceInput}>
                      <input
                        className={workspace.formField}
                        type="number"
                        min={0}
                        inputMode="numeric"
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
          disabled={catalog.length === 0}
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
                        <span className={workspace.primaryText}>{model.modelName}</span>
                        <span className={workspace.monoText}>{model.modelCode}</span>
                        {model.defaultFlag === 1 ? (
                          <span className={workspace.badge}>默认</span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="适配器">{adapterLabels[model.adapter]}</td>
                    <td data-label="能力">
                      {model.imageToImageEnabled ? "文生图 / 图生图" : "文生图"}
                    </td>
                    <td data-label="积分价格">
                      {model.supportedQualities
                        .map(
                          (quality) =>
                            `${qualityLabels[quality] ?? quality} ${model.pointsByQuality[quality] ?? "-"}`,
                        )
                        .join(" / ")}
                    </td>
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
          <div className={workspace.empty}>还没有配置图片模型</div>
        )}
      </section>
    </div>
  );
}
