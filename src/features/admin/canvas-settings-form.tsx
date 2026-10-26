"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type { CanvasSettingsConfig } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import styles from "./admin-forms.module.css";

type CanvasModelOption = {
  modelCode: string;
  modelName: string;
  isEnabled: boolean;
};

type CanvasSettingsFormProps = {
  initialSettings: CanvasSettingsConfig;
  models: CanvasModelOption[];
};

type LimitField = "maxBoards" | "maxNodes" | "maxSceneKb" | "maxPendingTasks";

type LimitInput = {
  field: LimitField;
  label: string;
  unit: string;
  min: number;
  max: number;
};

const limitInputs: LimitInput[] = [
  { field: "maxBoards", label: "每位用户画布上限", unit: "个", min: 1, max: 1000 },
  { field: "maxNodes", label: "单个画布节点上限", unit: "个", min: 10, max: 5000 },
  { field: "maxSceneKb", label: "画布数据上限", unit: "KB", min: 64, max: 10240 },
  { field: "maxPendingTasks", label: "单个画布并发任务", unit: "个", min: 1, max: 20 },
];

function readForm(settings: CanvasSettingsConfig) {
  return {
    isEnabled: settings.enabled,
    maxBoards: String(settings.maxBoardsPerUser),
    maxNodes: String(settings.maxNodesPerBoard),
    maxSceneKb: String(settings.maxSceneKb),
    maxPendingTasks: String(settings.maxPendingTasksPerBoard),
    modelCodes: [...settings.allowedModelCodes],
  };
}

function readOptions(models: CanvasModelOption[], modelCodes: string[]) {
  const options = [...models];
  for (const modelCode of modelCodes) {
    const isListed = models.some((model) => model.modelCode === modelCode);
    if (!isListed) {
      options.push({ modelCode, modelName: modelCode, isEnabled: false });
    }
  }

  return options;
}

export function CanvasSettingsForm(props: CanvasSettingsFormProps) {
  const initialSettings = props.initialSettings;
  const models = props.models;

  const [form, setForm] = useState(() => readForm(initialSettings));
  const [isEnabled, setEnabled] = useState(initialSettings.enabled);
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);

  const options = readOptions(models, form.modelCodes);
  const isAllModels = form.modelCodes.length === 0;
  const hasEmptyLimit = limitInputs.some((input) => !form[input.field].trim());

  function updateForm(nextForm: Partial<typeof form>) {
    setForm((currentForm) => {
      return {
        ...currentForm,
        ...nextForm,
      };
    });
  }

  function toggleModel(modelCode: string) {
    const isSelected = form.modelCodes.includes(modelCode);
    if (isSelected) {
      const modelCodes = form.modelCodes.filter((code) => code !== modelCode);
      updateForm({ modelCodes });
      return;
    }

    updateForm({ modelCodes: [...form.modelCodes, modelCode] });
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const nextSettings = await adminSettingsApi.saveCanvas({
        enabled: form.isEnabled,
        maxBoardsPerUser: Number(form.maxBoards),
        maxNodesPerBoard: Number(form.maxNodes),
        maxSceneKb: Number(form.maxSceneKb),
        maxPendingTasksPerBoard: Number(form.maxPendingTasks),
        allowedModelCodes: form.modelCodes,
      });
      setForm(readForm(nextSettings));
      setEnabled(nextSettings.enabled);
      setMessage("画布设置已保存。");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.adminForms__form} onSubmit={saveSettings}>
      <div className={styles.adminForms__header}>
        <div>
          <h2 className={styles.adminForms__title}>无限画布设置</h2>
        </div>
        <span className="rounded-md bg-soft px-3 py-2 text-xs font-medium text-muted">
          {isEnabled ? "已启用" : "已停用"}
        </span>
      </div>

      <button
        type="button"
        onClick={() => updateForm({ isEnabled: !form.isEnabled })}
        className={styles.adminForms__toggle}
        aria-pressed={form.isEnabled}
      >
        <span>
          <span className={styles.adminForms__toggleLabel}>启用无限画布</span>
        </span>
        <span
          className={clsx(
            styles.adminForms__switch,
            form.isEnabled && styles.adminForms__switchChecked,
          )}
          aria-hidden="true"
        >
          <span
            className={clsx(
              styles.adminForms__switchThumb,
              form.isEnabled && styles.adminForms__switchThumbChecked,
            )}
          />
        </span>
      </button>

      <section className={styles.adminForms__section}>
        <h3 className={styles.adminForms__sectionTitle}>使用限制</h3>
        <div className={styles.adminForms__fieldGrid}>
          {limitInputs.map((input) => (
            <label key={input.field} className="grid gap-2">
              <span className="label">{input.label}</span>
              <span className={styles.adminForms__inputWithUnit}>
                <input
                  className="field"
                  type="number"
                  inputMode="numeric"
                  min={input.min}
                  max={input.max}
                  step={1}
                  value={form[input.field]}
                  onChange={(event) => updateForm({ [input.field]: event.target.value })}
                />
                <span className={styles.adminForms__unit}>{input.unit}</span>
              </span>
              <span className="text-xs text-muted">
                {input.min} - {input.max}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className={styles.adminForms__section}>
        <h3 className={styles.adminForms__sectionTitle}>可用模型</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="可用模型">
          <button
            type="button"
            className={clsx(
              "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs",
              isAllModels && "border-foreground bg-foreground text-background",
              !isAllModels && "border-line text-foreground hover:bg-soft",
            )}
            aria-pressed={isAllModels}
            onClick={() => updateForm({ modelCodes: [] })}
          >
            {isAllModels ? <Check size={13} aria-hidden="true" /> : null}
            全部图片模型
          </button>
          {options.map((model) => {
            const isSelected = form.modelCodes.includes(model.modelCode);
            return (
              <button
                key={model.modelCode}
                type="button"
                className={clsx(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs",
                  isSelected && "border-foreground bg-foreground text-background",
                  !isSelected && "border-line text-foreground hover:bg-soft",
                )}
                aria-pressed={isSelected}
                onClick={() => toggleModel(model.modelCode)}
              >
                {isSelected ? <Check size={13} aria-hidden="true" /> : null}
                {model.modelName} ({model.modelCode})
                {model.isEnabled ? null : <span className="opacity-70">已停用</span>}
              </button>
            );
          })}
        </div>
        {options.length === 0 ? <p className="text-sm text-muted">暂无图片模型</p> : null}
      </section>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      <button className="btn-primary w-full md:w-fit" disabled={isSaving || hasEmptyLimit}>
        {isSaving ? "保存中" : "保存画布设置"}
      </button>
    </form>
  );
}

export type { CanvasModelOption };
