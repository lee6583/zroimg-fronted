"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminSettingsApi } from "@/api/admin/settings";
import type { CanvasSettingsConfig } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import { Advanced, Affix, ChipGroup, Field, FormCard, SwitchRow } from "./admin-form";
import workspace from "./admin-workspace.module.css";

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
  { field: "maxBoards", label: "每位用户画布上限", unit: "个画布", min: 1, max: 1000 },
  { field: "maxNodes", label: "单个画布节点上限", unit: "个节点", min: 10, max: 5000 },
  { field: "maxSceneKb", label: "画布数据上限", unit: "KB", min: 64, max: 10240 },
  { field: "maxPendingTasks", label: "单个画布并发任务", unit: "个任务", min: 1, max: 20 },
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

  const router = useRouter();
  const [form, setForm] = useState(() => readForm(initialSettings));
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
    if (!modelCode) {
      updateForm({ modelCodes: [] });
      return;
    }

    const isSelected = form.modelCodes.includes(modelCode);
    if (isSelected) {
      const modelCodes = form.modelCodes.filter((code) => code !== modelCode);
      updateForm({ modelCodes });
      return;
    }

    updateForm({ modelCodes: [...form.modelCodes, modelCode] });
  }

  async function saveSettings() {
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
      setMessage("已保存");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const modelOptions = [
    { value: "", label: "全部图片模型" },
    ...options.map((model) => {
      const suffix = model.isEnabled ? "" : "（已停用）";
      return { value: model.modelCode, label: `${model.modelName}${suffix}` };
    }),
  ];
  const selectedCodes = isAllModels ? [""] : form.modelCodes;

  return (
    <FormCard
      title="无限画布"
      message={message}
      saveLabel="保存"
      isSaving={isSaving}
      canSave={!hasEmptyLimit}
      onSubmit={saveSettings}
    >
      <div className={workspace.switchList}>
        <SwitchRow
          label="启用无限画布"
          checked={form.isEnabled}
          onChange={(nextEnabled) => updateForm({ isEnabled: nextEnabled })}
        />
      </div>

      <ChipGroup
        label="可用模型"
        options={modelOptions}
        selected={selectedCodes}
        onToggle={toggleModel}
      />

      <Advanced id="canvas">
        <div className={workspace.formGrid}>
          {limitInputs.map((input) => (
            <Field key={input.field} label={input.label} hint={`${input.min} – ${input.max}`}>
              <Affix suffix={input.unit}>
                <input
                  type="number"
                  inputMode="numeric"
                  min={input.min}
                  max={input.max}
                  step={1}
                  value={form[input.field]}
                  onChange={(event) => updateForm({ [input.field]: event.target.value })}
                />
              </Affix>
            </Field>
          ))}
        </div>
      </Advanced>
    </FormCard>
  );
}

export type { CanvasModelOption };
