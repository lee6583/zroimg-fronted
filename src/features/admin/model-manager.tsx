"use client";

import clsx from "clsx";
import { ArrowLeft, KeyRound, Pencil, Plus, Power, Save, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppSelect } from "@/components/ui/app-select";
import { adminModelsApi } from "@/api/admin/models";
import { getErrorMessage } from "@/utils/error";
import type {
  AdminGenerationModel,
  AdminGenerationModelMode,
  AdminGenerationModelParam,
  AdminGenerationModelPrice,
  SaveAdminGenerationModelRequest,
} from "@/types/admin";
import workspace from "./admin-workspace.module.css";

type ModelManagerProps = {
  initialModels: AdminGenerationModel[];
};

type ModelForm = {
  modelCode: string;
  modelName: string;
  provider: string;
  apiBaseUrl: string;
  apiKey: string;
  clearApiKey: boolean;
  modelType: "image" | "video";
  status: "enabled" | "disabled";
  defaultFlag: number;
  sortOrder: string;
  remark: string;
  priceVersion: string;
  priceChangeReason: string;
  modesText: string;
  paramsText: string;
  pricesText: string;
};

type ModelEditorTab = "basic" | "capabilities" | "pricing";

function emptyForm(): ModelForm {
  return {
    modelCode: "",
    modelName: "",
    provider: "openai",
    apiBaseUrl: "https://api.openai.com/v1",
    apiKey: "",
    clearApiKey: false,
    modelType: "image",
    status: "enabled",
    defaultFlag: 0,
    sortOrder: "0",
    remark: "",
    priceVersion: "",
    priceChangeReason: "",
    modesText: "text_to_image|文生图|enabled|10\nimage_to_image|图生图|enabled|20",
    paramsText:
      "|ratio|1:1|1:1|1|10\n|ratio|16:9|16:9|0|20\n|resolution|1K|1K|1|10\n|resolution|2K|2K|0|20\n|quality|medium|中|1|10\n|format|png|PNG|1|10\n|count|1|1|1|10",
    pricesText: "text_to_image|1K|medium|10|enabled\nimage_to_image|1K|medium|15|enabled",
  };
}

function formFromModel(model: AdminGenerationModel): ModelForm {
  const modesText = model.modes
    .map((mode) => `${mode.modeCode}|${mode.modeName}|${mode.status}|${mode.sortOrder}`)
    .join("\n");
  const paramsText = model.params
    .map(
      (param) =>
        `${param.modeCode}|${param.paramType}|${param.paramValue}|${param.paramLabel}|${param.defaultFlag}|${param.sortOrder}`,
    )
    .join("\n");
  const pricesText = model.prices
    .map(
      (price) =>
        `${price.modeCode}|${price.resolution}|${price.quality}|${price.points}|${price.status}`,
    )
    .join("\n");

  return {
    modelCode: model.modelCode,
    modelName: model.modelName,
    provider: model.provider,
    apiBaseUrl: model.apiBaseUrl,
    apiKey: "",
    clearApiKey: false,
    modelType: model.modelType,
    status: model.status,
    defaultFlag: model.defaultFlag,
    sortOrder: String(model.sortOrder),
    remark: model.remark ?? "",
    priceVersion: model.priceVersion,
    priceChangeReason: "",
    modesText,
    paramsText,
    pricesText,
  };
}

function readParts(line: string, expected: number) {
  const parts = line.split("|").map((part) => part.trim());
  if (parts.length !== expected || parts.some((part, index) => index > 0 && !part)) {
    throw new Error(`配置行格式不正确：${line}`);
  }
  return parts;
}

function readLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function readNumber(value: string, label: string) {
  const number = Number(value);
  if (!Number.isInteger(number)) {
    throw new Error(`${label}必须是整数`);
  }
  return number;
}

function readFlag(value: string, label: string) {
  const flag = readNumber(value, label);
  if (flag !== 0 && flag !== 1) {
    throw new Error(`${label}只能是 0 或 1`);
  }
  return flag;
}

function readStatus(value: string): "enabled" | "disabled" {
  if (value === "enabled" || value === "disabled") {
    return value;
  }
  throw new Error("状态只能是 enabled 或 disabled");
}

function readParamType(value: string): AdminGenerationModelParam["paramType"] {
  if (
    value === "ratio" ||
    value === "resolution" ||
    value === "quality" ||
    value === "format" ||
    value === "count" ||
    value === "duration" ||
    value === "audio"
  ) {
    return value;
  }
  throw new Error(`参数类型不正确：${value}`);
}

function buildInput(form: ModelForm): SaveAdminGenerationModelRequest {
  const modes: AdminGenerationModelMode[] = readLines(form.modesText).map((line) => {
    const parts = readParts(line, 4);
    return {
      modeCode: parts[0],
      modeName: parts[1],
      status: readStatus(parts[2]),
      sortOrder: readNumber(parts[3], "模式排序"),
    };
  });

  const params: AdminGenerationModelParam[] = readLines(form.paramsText).map((line) => {
    const parts = readParts(line, 6);
    return {
      modeCode: parts[0],
      paramType: readParamType(parts[1]),
      paramValue: parts[2],
      paramLabel: parts[3],
      defaultFlag: readFlag(parts[4], "参数默认状态"),
      sortOrder: readNumber(parts[5], "参数排序"),
    };
  });

  const prices: AdminGenerationModelPrice[] = readLines(form.pricesText).map((line) => {
    const parts = readParts(line, 5);
    return {
      modeCode: parts[0],
      resolution: parts[1],
      quality: parts[2],
      points: readNumber(parts[3], "价格积分"),
      status: readStatus(parts[4]),
    };
  });

  return {
    modelCode: form.modelCode.trim(),
    modelName: form.modelName.trim(),
    provider: form.provider.trim(),
    apiBaseUrl: form.apiBaseUrl.trim(),
    apiKey: form.apiKey.trim(),
    clearApiKey: form.clearApiKey,
    modelType: form.modelType,
    status: form.status,
    defaultFlag: form.defaultFlag,
    sortOrder: readNumber(form.sortOrder, "模型排序"),
    remark: form.remark.trim(),
    priceVersion: form.priceVersion.trim(),
    priceChangeReason: form.priceChangeReason.trim(),
    modes,
    params,
    prices,
  };
}

export function ModelManager(props: ModelManagerProps) {
  const [models, setModels] = useState(props.initialModels);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [isEditorOpen, setEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ModelEditorTab>("basic");

  function updateForm(nextForm: Partial<ModelForm>) {
    setForm((currentForm) => {
      return { ...currentForm, ...nextForm };
    });
  }

  function replaceModel(nextModel: AdminGenerationModel) {
    setModels((currentModels) => {
      const modelExists = currentModels.some((model) => model.id === nextModel.id);
      if (!modelExists) return [...currentModels, nextModel];
      return currentModels.map((model) => {
        if (model.id === nextModel.id) return nextModel;
        if (nextModel.defaultFlag === 1 && model.modelType === nextModel.modelType) {
          return { ...model, defaultFlag: 0 };
        }
        return model;
      });
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage("");
    setActiveTab("basic");
    setEditorOpen(true);
  }

  function closeEditor() {
    setEditingId(null);
    setForm(emptyForm());
    setMessage("");
    setActiveTab("basic");
    setEditorOpen(false);
  }

  function startEdit(model: AdminGenerationModel) {
    setEditingId(model.id);
    setForm(formFromModel(model));
    setMessage("");
    setActiveTab("basic");
    setEditorOpen(true);
  }

  async function save() {
    let input: SaveAdminGenerationModelRequest;
    try {
      if (!editingId && !form.apiKey.trim()) {
        throw new Error("新建模型时必须填写 API Key");
      }
      input = buildInput(form);
    } catch (error) {
      setMessage(getErrorMessage(error));
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      const result = editingId
        ? await adminModelsApi.update(editingId, input)
        : await adminModelsApi.create(input);
      replaceModel(result.model);
      setEditingId(result.model.id);
      setForm(formFromModel(result.model));
      setMessage("模型配置已保存");
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
    const shouldRemove = window.confirm(`确定删除模型“${model.modelName}”吗？`);
    if (!shouldRemove) return;

    try {
      await adminModelsApi.remove(model.id);
      setModels((currentModels) => currentModels.filter((item) => item.id !== model.id));
      if (editingId === model.id) closeEditor();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className={workspace.workspace}>
      {isEditorOpen ? (
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
              { value: "capabilities" as const, label: "能力参数" },
              { value: "pricing" as const, label: "计费规则" },
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
                  <label className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>模型编码</span>
                    <input
                      className={workspace.formField}
                      placeholder="例如 gpt-image-1"
                      value={form.modelCode}
                      onChange={(event) => updateForm({ modelCode: event.target.value })}
                    />
                  </label>
                  <label className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>模型名称</span>
                    <input
                      className={workspace.formField}
                      placeholder="后台与前台展示名称"
                      value={form.modelName}
                      onChange={(event) => updateForm({ modelName: event.target.value })}
                    />
                  </label>
                  <label className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>供应商</span>
                    <input
                      className={workspace.formField}
                      placeholder="例如 openai"
                      value={form.provider}
                      onChange={(event) => updateForm({ provider: event.target.value })}
                    />
                  </label>
                  <div className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>模型类型</span>
                    <AppSelect
                      value={form.modelType}
                      onChange={(modelType) => updateForm({ modelType })}
                      options={[
                        { value: "image", label: "图片模型" },
                        { value: "video", label: "视频模型" },
                      ]}
                    />
                  </div>
                  <label className={clsx(workspace.fieldGroup, workspace.fieldGroupFull)}>
                    <span className={workspace.fieldLabel}>API Base URL</span>
                    <input
                      className={workspace.formField}
                      type="url"
                      placeholder="https://api.openai.com/v1"
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
                      placeholder={editingId ? "留空保留当前密钥" : "新建模型时必须填写"}
                      value={form.apiKey}
                      disabled={form.clearApiKey}
                      onChange={(event) => updateForm({ apiKey: event.target.value })}
                    />
                    <span className={workspace.fieldHint}>
                      密钥仅提交到服务端，页面不会显示完整内容
                    </span>
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
                  <label className={clsx(workspace.fieldGroup, workspace.fieldGroupFull)}>
                    <span className={workspace.fieldLabel}>模型说明</span>
                    <input
                      className={workspace.formField}
                      placeholder="模型用途、版本或注意事项"
                      value={form.remark}
                      onChange={(event) => updateForm({ remark: event.target.value })}
                    />
                  </label>
                </div>

                <section className={workspace.formSection}>
                  <h2 className={workspace.formSectionTitle}>发布设置</h2>
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
                      <span>设为该类型默认模型</span>
                      <input
                        type="checkbox"
                        checked={form.defaultFlag === 1}
                        onChange={(event) =>
                          updateForm({ defaultFlag: event.target.checked ? 1 : 0 })
                        }
                      />
                    </label>
                    {editingId ? (
                      <label className={workspace.switchRow}>
                        <span>清除已保存的 API Key</span>
                        <input
                          type="checkbox"
                          checked={form.clearApiKey}
                          onChange={(event) =>
                            updateForm({ clearApiKey: event.target.checked, apiKey: "" })
                          }
                        />
                      </label>
                    ) : null}
                  </div>
                </section>
              </div>
            ) : null}

            {activeTab === "capabilities" ? (
              <div className={workspace.formSection}>
                <p className={workspace.configCallout}>
                  每行一条配置，字段使用竖线分隔。保存时会进行格式和数值校验。
                </p>
                <label className={workspace.fieldGroup}>
                  <span className={workspace.fieldLabel}>生成模式</span>
                  <textarea
                    className={clsx(workspace.formTextarea, workspace.codeTextarea)}
                    value={form.modesText}
                    onChange={(event) => updateForm({ modesText: event.target.value })}
                    placeholder="模式编码|模式名称|状态|排序"
                  />
                  <span className={workspace.fieldHint}>
                    格式：模式编码 | 模式名称 | 状态 | 排序
                  </span>
                </label>
                <label className={workspace.fieldGroup}>
                  <span className={workspace.fieldLabel}>能力参数</span>
                  <textarea
                    className={clsx(workspace.formTextarea, workspace.codeTextarea)}
                    value={form.paramsText}
                    onChange={(event) => updateForm({ paramsText: event.target.value })}
                    placeholder="模式编码|参数类型|参数值|展示名|默认标记|排序"
                  />
                  <span className={workspace.fieldHint}>
                    格式：模式编码 | 参数类型 | 参数值 | 展示名 | 默认标记 | 排序
                  </span>
                </label>
              </div>
            ) : null}

            {activeTab === "pricing" ? (
              <div className={workspace.formSection}>
                <div className={workspace.formGrid}>
                  <label className={workspace.fieldGroup}>
                    <span className={workspace.fieldLabel}>价格版本</span>
                    <input
                      className={workspace.formField}
                      placeholder="例如 2026-08"
                      value={form.priceVersion}
                      onChange={(event) => updateForm({ priceVersion: event.target.value })}
                    />
                  </label>
                  <label className={clsx(workspace.fieldGroup, workspace.fieldGroupFull)}>
                    <span className={workspace.fieldLabel}>价格变更说明</span>
                    <input
                      className={workspace.formField}
                      placeholder="记录本次价格调整原因"
                      value={form.priceChangeReason}
                      onChange={(event) => updateForm({ priceChangeReason: event.target.value })}
                    />
                  </label>
                  <label className={clsx(workspace.fieldGroup, workspace.fieldGroupFull)}>
                    <span className={workspace.fieldLabel}>计费规则</span>
                    <textarea
                      className={clsx(workspace.formTextarea, workspace.codeTextarea)}
                      value={form.pricesText}
                      onChange={(event) => updateForm({ pricesText: event.target.value })}
                      placeholder="模式编码|分辨率|质量|积分|状态"
                    />
                    <span className={workspace.fieldHint}>
                      格式：模式编码 | 分辨率 | 质量 | 所需积分 | 状态
                    </span>
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <>
          <header className={workspace.header}>
            <div className={workspace.headerCopy}>
              <h1 className="page-title">模型配置</h1>
            </div>
            <div className={workspace.headerActions}>
              <button className={workspace.primaryAction} type="button" onClick={startCreate}>
                <Plus size={15} aria-hidden="true" />
                新建模型
              </button>
            </div>
          </header>

          <section className={workspace.panel}>
            {message ? <p className={workspace.inlineMessage}>{message}</p> : null}
            {models.length > 0 ? (
              <div className={workspace.tableWrap}>
                <table className={clsx(workspace.table, workspace.modelsTable)}>
                  <thead>
                    <tr>
                      <th>模型</th>
                      <th>供应商</th>
                      <th>类型</th>
                      <th>接口与密钥</th>
                      <th>价格版本</th>
                      <th>状态</th>
                      <th aria-label="操作" />
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
                              <span className={workspace.badge}>默认模型</span>
                            ) : null}
                          </div>
                        </td>
                        <td data-label="供应商">{model.provider}</td>
                        <td data-label="类型">{model.modelType === "image" ? "图片" : "视频"}</td>
                        <td data-label="接口与密钥">
                          <div className={workspace.primaryCell}>
                            <span className={workspace.truncate} title={model.apiBaseUrl}>
                              {model.apiBaseUrl}
                            </span>
                            <span className={workspace.secondaryText}>
                              <KeyRound size={11} aria-hidden="true" />{" "}
                              {model.hasApiKey ? model.apiKeyPreview : "未配置密钥"}
                            </span>
                          </div>
                        </td>
                        <td data-label="价格版本">{model.priceVersion || "—"}</td>
                        <td data-label="状态">
                          <span
                            className={clsx(
                              workspace.status,
                              model.status === "enabled" && workspace.statusSuccess,
                            )}
                          >
                            {model.status === "enabled" ? "已启用" : "已停用"}
                          </span>
                        </td>
                        <td data-label="操作">
                          <div className={workspace.rowActions}>
                            <button
                              className={workspace.iconAction}
                              type="button"
                              title="编辑模型"
                              aria-label={`编辑模型 ${model.modelName}`}
                              onClick={() => startEdit(model)}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              className={workspace.iconAction}
                              type="button"
                              title={model.status === "enabled" ? "停用模型" : "启用模型"}
                              aria-label={`${model.status === "enabled" ? "停用" : "启用"}模型 ${model.modelName}`}
                              onClick={() => toggleStatus(model)}
                            >
                              <Power size={14} />
                            </button>
                            {model.defaultFlag !== 1 ? (
                              <button
                                className={workspace.iconAction}
                                type="button"
                                title="设为默认模型"
                                aria-label={`设 ${model.modelName} 为默认模型`}
                                onClick={() => setDefault(model)}
                              >
                                <Star size={14} />
                              </button>
                            ) : null}
                            <button
                              className={clsx(workspace.iconAction, workspace.textActionDanger)}
                              type="button"
                              title="删除模型"
                              aria-label={`删除模型 ${model.modelName}`}
                              onClick={() => remove(model)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={workspace.empty}>还没有配置生成模型</div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
