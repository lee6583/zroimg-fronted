"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminModelsApi } from "@/api/admin/models";
import { adminSettingsApi } from "@/api/admin/settings";
import { AppSelect } from "@/components/ui/app-select";
import type {
  DiscoveredProviderModel,
  GenerationProviderConnection,
  GenerationSettingsConfig,
} from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import { Advanced, Affix, Field, FormCard, SwitchRow } from "./admin-form";
import { adapterLabels } from "./provider-connection-panel";
import workspace from "./admin-workspace.module.css";

type GenerationSettingsFormProps = {
  initialSettings: GenerationSettingsConfig;
  // AI 润色调用对话模型使用的中转站连接
  connections: GenerationProviderConnection[];
};

type LimitField = "image" | "video";

type FormState = {
  image: string;
  video: string;
  isAutoRetry: boolean;
  maxRetries: string;
  isReadTimeoutRetry: boolean;
  polishImagePoints: string;
  polishVideoPoints: string;
  polishImageMaxChars: string;
  polishVideoMaxChars: string;
  polishConnectionId: string;
  polishModelCode: string;
};

type PolishField =
  "polishImagePoints" | "polishVideoPoints" | "polishImageMaxChars" | "polishVideoMaxChars";

type PolishInput = {
  field: PolishField;
  label: string;
  suffix: string;
  min: number;
  max: number;
};

type LimitInput = {
  field: LimitField;
  label: string;
  min: number;
  max: number;
};

const limitInputs: LimitInput[] = [
  { field: "image", label: "每位用户同时进行的图片任务", min: 1, max: 50 },
  { field: "video", label: "每位用户同时进行的视频任务", min: 1, max: 20 },
];

const polishInputs: PolishInput[] = [
  { field: "polishImagePoints", label: "图片润色消耗", suffix: "积分/次", min: 0, max: 1000 },
  { field: "polishVideoPoints", label: "视频润色消耗", suffix: "积分/次", min: 0, max: 1000 },
  { field: "polishImageMaxChars", label: "图片润色最大字数", suffix: "字", min: 50, max: 2000 },
  { field: "polishVideoMaxChars", label: "视频润色最大字数", suffix: "字", min: 50, max: 2000 },
];

// 下拉中选择该项后改为手动输入对话模型 ID
const manualModelCode = "__manual__";

// 重试、润色字段缺失时使用 Java 默认值
function readForm(settings: GenerationSettingsConfig): FormState {
  return {
    image: String(settings.maxActiveImageTasksPerUser),
    video: String(settings.maxActiveVideoTasksPerUser),
    isAutoRetry: settings.autoRetryEnabled ?? true,
    maxRetries: String(settings.maxRetries ?? 3),
    isReadTimeoutRetry: settings.retryOnImageReadTimeout ?? false,
    polishImagePoints: String(settings.polishImagePoints ?? 1),
    polishVideoPoints: String(settings.polishVideoPoints ?? 1),
    polishImageMaxChars: String(settings.polishImageMaxChars ?? 800),
    polishVideoMaxChars: String(settings.polishVideoMaxChars ?? 800),
    polishConnectionId: settings.polishConnectionId ?? "",
    polishModelCode: settings.polishModelCode ?? "",
  };
}

export function GenerationSettingsForm(props: GenerationSettingsFormProps) {
  const initialSettings = props.initialSettings;
  const connections = props.connections;

  const router = useRouter();
  const [form, setForm] = useState(() => readForm(initialSettings));
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");
  const [isSaving, setSaving] = useState(false);
  const [discovered, setDiscovered] = useState<DiscoveredProviderModel[]>([]);
  const [discoveredConnectionId, setDiscoveredConnectionId] = useState<string | null>(null);
  const [isDiscovering, setDiscovering] = useState(false);

  const hasEmptyLimit = limitInputs.some((input) => !form[input.field].trim());
  const hasEmptyRetries = !form.maxRetries.trim();
  const hasEmptyPolish = polishInputs.some((input) => !form[input.field].trim());
  const polishConnectionId = form.polishConnectionId;
  const discoveredModels =
    polishConnectionId && discoveredConnectionId === polishConnectionId ? discovered : [];
  const connectionOptions = [
    { value: "", label: "未选择（不启用 AI 润色）" },
    ...connections.map((item) => {
      const parts = [item.name, adapterLabels[item.adapter]];
      if (item.status !== "enabled") parts.push("已停用");
      return { value: item.id, label: parts.join(" · ") };
    }),
  ];

  function updateForm(nextForm: Partial<FormState>) {
    setForm((currentForm) => {
      return {
        ...currentForm,
        ...nextForm,
      };
    });
  }

  async function saveSettings() {
    setSaving(true);
    setMessage("");

    try {
      const nextSettings = await adminSettingsApi.saveGeneration({
        maxActiveImageTasksPerUser: Number(form.image),
        maxActiveVideoTasksPerUser: Number(form.video),
        autoRetryEnabled: form.isAutoRetry,
        maxRetries: Number(form.maxRetries),
        retryOnImageReadTimeout: form.isReadTimeoutRetry,
        polishImagePoints: Number(form.polishImagePoints),
        polishVideoPoints: Number(form.polishVideoPoints),
        polishImageMaxChars: Number(form.polishImageMaxChars),
        polishVideoMaxChars: Number(form.polishVideoMaxChars),
        polishConnectionId: form.polishConnectionId || null,
        polishModelCode: form.polishModelCode.trim(),
      });
      setForm(readForm(nextSettings));
      setSettings(nextSettings);
      setMessage("已保存");
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function discoverPolishModels() {
    if (!polishConnectionId) {
      setMessage("请先选择中转站连接");
      return;
    }

    const connectionId = polishConnectionId;
    setDiscovering(true);
    setMessage("");
    try {
      const models = await adminModelsApi.discoverSaved(connectionId);
      setDiscovered(models);
      setDiscoveredConnectionId(connectionId);
      if (models.length === 0) setMessage("中转站没有返回可用模型，请手动输入");
    } catch (error) {
      setDiscovered([]);
      setDiscoveredConnectionId(null);
      setMessage(getErrorMessage(error));
    } finally {
      setDiscovering(false);
    }
  }

  function selectPolishModelCode(value: string) {
    if (value === manualModelCode) {
      setDiscovered([]);
      setDiscoveredConnectionId(null);
      return;
    }

    updateForm({ polishModelCode: value });
  }

  function renderPolishModelCode() {
    if (discoveredModels.length) {
      return (
        <AppSelect
          value={form.polishModelCode}
          onChange={selectPolishModelCode}
          placeholder="从可用模型中选择"
          triggerClassName={workspace.selectTrigger}
          options={[
            ...discoveredModels.map((item) => ({
              value: item.id,
              label: item.ownedBy ? `${item.id} · ${item.ownedBy}` : item.id,
            })),
            { value: manualModelCode, label: "手动输入…" },
          ]}
        />
      );
    }

    return (
      <input
        className={workspace.formField}
        value={form.polishModelCode}
        maxLength={200}
        placeholder="例如 gpt-4o-mini"
        aria-label="对话模型 ID"
        onChange={(event) => updateForm({ polishModelCode: event.target.value })}
      />
    );
  }

  return (
    <FormCard
      title="生成并发"
      message={message}
      saveLabel="保存"
      isSaving={isSaving}
      canSave={!hasEmptyLimit && !hasEmptyRetries && !hasEmptyPolish}
      onSubmit={saveSettings}
    >
      <div className={workspace.formGrid}>
        {limitInputs.map((input) => (
          <Field key={input.field} label={input.label} hint={`${input.min} – ${input.max}`}>
            <Affix suffix="个任务">
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

      <div className={workspace.switchList}>
        <SwitchRow
          label="自动重试"
          checked={form.isAutoRetry}
          onChange={(nextChecked) => updateForm({ isAutoRetry: nextChecked })}
        />
      </div>

      <div className={workspace.formGrid}>
        <Field label="最大重试次数" hint="0 – 5，仅对超时、限流、5xx、空结果等临时错误重试">
          <Affix suffix="次">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={5}
              step={1}
              value={form.maxRetries}
              disabled={!form.isAutoRetry}
              onChange={(event) => updateForm({ maxRetries: event.target.value })}
            />
          </Affix>
        </Field>
      </div>

      <section className={workspace.formSection}>
        <h3 className={workspace.formSectionTitle}>AI 润色</h3>
        <div className={workspace.formGrid}>
          {polishInputs.map((input) => (
            <Field key={input.field} label={input.label} hint={`${input.min} – ${input.max}`}>
              <Affix suffix={input.suffix}>
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
          <Field label="中转站连接" hint="调用对话模型改写提示词" isGroup>
            <AppSelect
              value={form.polishConnectionId}
              onChange={(value) => updateForm({ polishConnectionId: value })}
              triggerClassName={workspace.selectTrigger}
              options={connectionOptions}
            />
          </Field>
          <Field label="对话模型 ID" hint="中转站上用于改写提示词的对话模型" isGroup>
            <div className={workspace.fieldWithAction}>
              {renderPolishModelCode()}
              <button
                className={workspace.secondaryAction}
                type="button"
                disabled={!polishConnectionId || isDiscovering}
                onClick={discoverPolishModels}
              >
                <RefreshCw size={14} aria-hidden="true" />
                {isDiscovering ? "拉取中" : "拉取可用模型"}
              </button>
            </div>
          </Field>
        </div>
      </section>

      <Advanced id="generation">
        <div className={workspace.switchList}>
          <SwitchRow
            label="图片读取超时也重试"
            hint="可能导致上游重复计费"
            checked={form.isReadTimeoutRetry}
            disabled={!form.isAutoRetry}
            onChange={(nextChecked) => updateForm({ isReadTimeoutRetry: nextChecked })}
          />
        </div>
        <div className={workspace.formGrid}>
          <Field
            label="服务器图片并发"
            hint="0 表示不限制，由 GENERATION_IMAGE_CONCURRENCY 配置"
            isGroup
          >
            <span className={workspace.readonlyValue}>{settings.imageConcurrency || "不限制"}</span>
          </Field>
          <Field
            label="服务器视频并发"
            hint="0 表示不限制，由 GENERATION_VIDEO_CONCURRENCY 配置"
            isGroup
          >
            <span className={workspace.readonlyValue}>{settings.videoConcurrency || "不限制"}</span>
          </Field>
        </div>
      </Advanced>
    </FormCard>
  );
}
