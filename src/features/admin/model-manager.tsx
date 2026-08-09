"use client";

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

type ModelManagerProps = {
  initialModels: AdminGenerationModel[];
};

type ModelForm = {
  modelCode: string;
  modelName: string;
  provider: string;
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

function emptyForm(): ModelForm {
  return {
    modelCode: "",
    modelName: "",
    provider: "openai",
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
  }

  function startEdit(model: AdminGenerationModel) {
    setEditingId(model.id);
    setForm(formFromModel(model));
    setMessage("");
  }

  async function save() {
    let input: SaveAdminGenerationModelRequest;
    try {
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
      if (editingId === model.id) startCreate();
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className="grid gap-6">
      <section className="surface rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">{editingId ? "编辑模型" : "新建模型"}</h2>
          {editingId ? (
            <button className="btn-secondary" type="button" onClick={startCreate}>
              新建
            </button>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            className="field"
            placeholder="模型编码"
            value={form.modelCode}
            onChange={(event) => updateForm({ modelCode: event.target.value })}
          />
          <input
            className="field"
            placeholder="模型名称"
            value={form.modelName}
            onChange={(event) => updateForm({ modelName: event.target.value })}
          />
          <input
            className="field"
            placeholder="供应商"
            value={form.provider}
            onChange={(event) => updateForm({ provider: event.target.value })}
          />
          <AppSelect
            value={form.modelType}
            onChange={(modelType) => updateForm({ modelType })}
            options={[
              { value: "image", label: "图片模型" },
              { value: "video", label: "视频模型" },
            ]}
          />
          <input
            className="field"
            placeholder="排序"
            inputMode="numeric"
            value={form.sortOrder}
            onChange={(event) => updateForm({ sortOrder: event.target.value })}
          />
          <input
            className="field"
            placeholder="价格版本"
            value={form.priceVersion}
            onChange={(event) => updateForm({ priceVersion: event.target.value })}
          />
          <input
            className="field md:col-span-2"
            placeholder="价格变更说明"
            value={form.priceChangeReason}
            onChange={(event) => updateForm({ priceChangeReason: event.target.value })}
          />
          <input
            className="field md:col-span-2"
            placeholder="模型说明"
            value={form.remark}
            onChange={(event) => updateForm({ remark: event.target.value })}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.status === "enabled"}
              onChange={(event) =>
                updateForm({ status: event.target.checked ? "enabled" : "disabled" })
              }
            />
            启用模型
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.defaultFlag === 1}
              onChange={(event) => updateForm({ defaultFlag: event.target.checked ? 1 : 0 })}
            />
            设为默认
          </label>
          <button className="btn-primary" type="button" disabled={isSaving} onClick={save}>
            {isSaving ? "保存中" : "保存模型"}
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          <textarea
            className="field min-h-24 font-mono text-xs"
            value={form.modesText}
            onChange={(event) => updateForm({ modesText: event.target.value })}
            placeholder="模式配置"
          />
          <textarea
            className="field min-h-40 font-mono text-xs"
            value={form.paramsText}
            onChange={(event) => updateForm({ paramsText: event.target.value })}
            placeholder="参数配置"
          />
          <textarea
            className="field min-h-24 font-mono text-xs"
            value={form.pricesText}
            onChange={(event) => updateForm({ pricesText: event.target.value })}
            placeholder="价格配置"
          />
        </div>
        {message ? <p className="mt-3 text-sm text-danger">{message}</p> : null}
      </section>

      <section className="grid gap-3">
        {models.map((model) => (
          <article key={model.id} className="surface rounded-xl p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{model.modelName}</h2>
                <p className="mt-1 text-sm text-muted">
                  {model.modelCode} / {model.provider} / {model.modelType}
                </p>
              </div>
              <div className="text-right text-sm text-muted">
                <p>{model.status === "enabled" ? "已启用" : "已停用"}</p>
                <p>{model.defaultFlag === 1 ? "默认模型" : "非默认"}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary" type="button" onClick={() => startEdit(model)}>
                编辑
              </button>
              <button className="btn-secondary" type="button" onClick={() => toggleStatus(model)}>
                {model.status === "enabled" ? "停用" : "启用"}
              </button>
              {model.defaultFlag !== 1 ? (
                <button className="btn-secondary" type="button" onClick={() => setDefault(model)}>
                  设为默认
                </button>
              ) : null}
              <button className="btn-secondary" type="button" onClick={() => remove(model)}>
                删除
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
