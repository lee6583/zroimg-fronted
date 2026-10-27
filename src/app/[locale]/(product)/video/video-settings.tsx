"use client";

import clsx from "clsx";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import type { ClipboardEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { uploadMediaFile } from "@/api/media/uploads";
import { AppSelect } from "@/components/ui/app-select";
import { Sheet, useIsMobile } from "@/components/ui/sheet";
import { PolishButton } from "@/features/polish/polish-button";
import { usePromptPolish } from "@/features/polish/use-prompt-polish";
import { getPastedImages } from "@/utils/clipboard-images";
import { isSupportedImageType, maxImageBytes } from "@/utils/media";
import { isContinuousDurations, trimReferences } from "@/utils/video-task";
import type { VideoGenerationMode, VideoModel, VideoPriceEstimate } from "@/types/video";
import { VideoReferences } from "./video-references";
import type { PendingReference } from "./video-references";
import type { VideoReference } from "./video-references";
import { estimateVideoTask, isVideoMode, submitVideoTask } from "./video-submit";
import type { VideoTaskInput } from "./video-submit";
import { useVideoText } from "./video-text";
import styles from "./video.module.css";

const estimateDelayMs = 300;

type VideoForm = {
  model: string;
  prompt: string;
  mode: VideoGenerationMode | "";
  duration: number | null;
  ratio: string;
  resolution: string;
  references: VideoReference[];
};

type SettingGroupProps = {
  title: string;
  children: ReactNode;
  hint?: string;
};

type OptionProps = {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
};

type VideoSettingsProps = {
  models: VideoModel[];
  onCreated: () => Promise<void>;
};

function firstText(values: string[], defaultValue: string | null) {
  if (defaultValue && values.includes(defaultValue)) {
    return defaultValue;
  }
  return values[0] || "";
}

function firstNumber(values: number[], defaultValue: number | null) {
  if (defaultValue !== null && values.includes(defaultValue)) {
    return defaultValue;
  }
  return values[0] ?? null;
}

function getModel(models: VideoModel[], modelCode: string) {
  return models.find((model) => model.modelCode === modelCode) || null;
}

/** 图生视频最多参考图数量；旧接口不返回时按 1 张。 */
function getMaxReferences(model: VideoModel | null) {
  const value = model?.supportParams.maxReferenceImages;
  if (value === undefined || value === null) {
    return 1;
  }
  return Math.max(value, 0);
}

function getMinReferences(model: VideoModel | null) {
  const value = model?.supportParams.minReferenceImages;
  if (!value || value < 1) {
    return 1;
  }
  return value;
}

function createForm(model: VideoModel | null, prompt = ""): VideoForm {
  if (!model) {
    return {
      model: "",
      prompt,
      mode: "",
      duration: null,
      ratio: "",
      resolution: "",
      references: [],
    };
  }

  const params = model.supportParams;
  const modes = model.supportModes.filter(isVideoMode);
  const defaultMode = params.defaults.mode;
  let mode: VideoGenerationMode | "" = modes[0] ?? "";
  if (defaultMode && isVideoMode(defaultMode) && modes.includes(defaultMode)) {
    mode = defaultMode;
  }
  const resolutions = params.resolutionsByMode[mode] ?? params.resolutions;

  return {
    model: model.modelCode,
    prompt,
    mode,
    duration: firstNumber(params.durations, params.defaults.duration),
    ratio: firstText(params.ratios, params.defaults.ratio),
    resolution: firstText(resolutions, params.defaults.resolution),
    references: [],
  };
}

export function VideoSettings(props: VideoSettingsProps) {
  const text = useVideoText();
  const t = text.t;
  const isMobile = useIsMobile();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const firstModel = props.models[0] || null;
  const [form, setForm] = useState(() => createForm(firstModel));
  const [message, setMessage] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [pendingReferences, setPendingReferences] = useState<PendingReference[]>([]);
  const [referenceError, setReferenceError] = useState("");
  const [estimate, setEstimate] = useState<VideoPriceEstimate | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const polish = usePromptPolish({
    scene: "video",
    prompt: form.prompt,
    referenceMediaIds:
      form.mode === "image_to_video" ? form.references.map((reference) => reference.id) : [],
    textareaRef: promptRef,
    onApply: (prompt) => updateForm({ prompt }),
    onNotice: setMessage,
  });

  const model = getModel(props.models, form.model);
  const params = model?.supportParams || null;
  const modes = model?.supportModes.filter(isVideoMode) ?? [];
  const canUseReferenceImage = form.mode === "image_to_video";
  const resolutions = params?.resolutionsByMode[form.mode] ?? params?.resolutions ?? [];
  const maxReferences = getMaxReferences(model);
  const minReferences = getMinReferences(model);
  const referenceIds = form.references.map((reference) => reference.id);
  const durations = params?.durations ?? [];
  const isDurationSlider = durations.length > 8 && isContinuousDurations(durations);
  const estimateKey = [
    form.model,
    form.mode,
    form.ratio,
    form.resolution,
    form.duration,
    canUseReferenceImage ? referenceIds.length : 0,
  ].join("|");

  // 参数变化后向后端试算价格（前端不维护计价公式），失败时不显示价格
  useEffect(() => {
    const input = buildInput();
    if (!input) {
      return;
    }

    let isActive = true;
    const timer = window.setTimeout(async () => {
      try {
        const price = await estimateVideoTask(input);
        if (isActive) {
          setEstimate(price);
        }
      } catch {
        if (isActive) {
          setEstimate(null);
        }
      }
    }, estimateDelayMs);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
    // estimateKey 已包含 buildInput 用到的全部参数
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateKey]);

  function buildInput(): VideoTaskInput | null {
    if (!form.model || !form.mode || !form.ratio || !form.resolution || form.duration === null) {
      return null;
    }
    return {
      model: form.model,
      mode: form.mode,
      prompt: form.prompt.trim(),
      ratio: form.ratio,
      resolution: form.resolution,
      duration: form.duration,
      referenceMediaId: canUseReferenceImage ? referenceIds[0] : undefined,
      referenceMediaIds: canUseReferenceImage ? referenceIds : undefined,
    };
  }

  function updateForm(nextForm: Partial<VideoForm>) {
    setForm((currentForm) => ({
      ...currentForm,
      ...nextForm,
    }));
  }

  // 切换模型：沿用提示词；新模型支持图生视频时保留参考图，超出上限的按上传顺序裁掉并提示
  function selectModel(modelCode: string) {
    const nextModel = getModel(props.models, modelCode);
    const nextForm = createForm(nextModel, form.prompt);
    const nextModes = nextModel?.supportModes.filter(isVideoMode) ?? [];
    const canKeepReferences = form.references.length > 0 && nextModes.includes("image_to_video");
    let notice = "";

    if (canKeepReferences && nextModel) {
      const nextMax = getMaxReferences(nextModel);
      const nextResolutions =
        nextModel.supportParams.resolutionsByMode.image_to_video ??
        nextModel.supportParams.resolutions;
      nextForm.mode = "image_to_video";
      nextForm.resolution = firstText(nextResolutions, nextForm.resolution);
      const trimmed = trimReferences(form.references, nextMax);
      nextForm.references = trimmed.kept;
      const removed = trimmed.removed;
      if (removed > 0) {
        notice = t("settings.referenceTrimmed", { removed, max: nextMax });
      }
    }

    setForm(nextForm);
    setMessage(notice);
  }

  function selectMode(mode: VideoGenerationMode) {
    const shouldClearReference = mode !== "image_to_video";
    const nextResolutions = params?.resolutionsByMode[mode] ?? params?.resolutions ?? [];
    updateForm({
      mode,
      resolution: firstText(nextResolutions, form.resolution),
      references: shouldClearReference ? [] : form.references,
    });
  }

  // 按选择顺序逐张上传，只上传剩余名额内的图片；上传中显示本地预览，失败原因显示在参考图区域内
  async function uploadReferences(files: File[]) {
    const slots = Math.max(maxReferences - form.references.length, 0);
    const accepted = files.slice(0, slots);
    const errors: string[] = [];
    if (files.length > accepted.length) {
      errors.push(t("settings.referenceLimit", { max: maxReferences }));
    }

    const maxMb = String(Math.round(maxImageBytes / 1024 / 1024));
    const valid: File[] = [];
    for (const file of accepted) {
      if (!isSupportedImageType(file.type)) {
        errors.push(t("settings.fileTypeInvalid", { name: file.name }));
      } else if (file.size <= 0 || file.size > maxImageBytes) {
        errors.push(t("settings.fileTooLarge", { name: file.name, max: maxMb }));
      } else {
        valid.push(file);
      }
    }

    setReferenceError(errors.join("\n"));
    setMessage("");
    if (valid.length === 0) {
      return;
    }

    const pending = valid.map((file) => ({
      key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      name: file.name,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingReferences(pending);
    setUploading(true);
    try {
      for (const [index, file] of valid.entries()) {
        try {
          const asset = await uploadMediaFile(file);
          const reference = { id: asset.id, name: asset.originalName || file.name };
          setForm((currentForm) => {
            const nextReferences = [...currentForm.references, reference];
            return { ...currentForm, references: nextReferences };
          });
        } catch (error) {
          errors.push(
            t("settings.uploadFailed", { name: file.name, reason: text.errorText(error) }),
          );
          setReferenceError(errors.join("\n"));
        }
        setPendingReferences((current) =>
          current.filter((item) => item.key !== pending[index]?.key),
        );
      }
    } finally {
      for (const item of pending) {
        URL.revokeObjectURL(item.previewUrl);
      }
      setPendingReferences([]);
      setUploading(false);
    }
  }

  // 在提示词框里粘贴图片：模型支持图生视频时，等同于上传参考图（必要时自动切到图生视频）
  function pasteReferences(event: ClipboardEvent<HTMLTextAreaElement>) {
    const images = getPastedImages(event.clipboardData);
    if (images.length === 0) return;

    event.preventDefault();
    const supportsImage = model?.supportModes.includes("image_to_video") ?? false;
    if (!supportsImage) {
      setReferenceError(t("settings.pasteUnsupported"));
      return;
    }
    if (form.mode !== "image_to_video") {
      selectMode("image_to_video");
    }
    void uploadReferences(images);
  }

  function removeReference(id: string) {
    setForm((currentForm) => {
      const nextReferences = currentForm.references.filter((reference) => reference.id !== id);
      return { ...currentForm, references: nextReferences };
    });
  }

  async function submit() {
    if (!model || !params) {
      setMessage(t("errors.notConfigured"));
      return;
    }
    if (!form.prompt.trim()) {
      setMessage(t("errors.promptRequired"));
      return;
    }
    if (!form.mode || !form.ratio || !form.resolution || form.duration === null) {
      setMessage(t("errors.paramsIncomplete"));
      return;
    }
    if (canUseReferenceImage && form.references.length < minReferences) {
      let requiredMessage = t("errors.referenceRequired");
      if (minReferences > 1) {
        requiredMessage = t("errors.referenceMin", { min: minReferences });
      }
      setMessage(requiredMessage);
      if (isMobile) {
        setSheetOpen(true);
      }
      return;
    }
    const input = buildInput();
    if (!input) {
      setMessage(t("errors.paramsIncomplete"));
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await submitVideoTask(input);
      await props.onCreated();
      setMessage(t("settings.submitted"));
    } catch (error) {
      setMessage(text.errorText(error));
    } finally {
      setSubmitting(false);
    }
  }

  const modelGroup = (
    <SettingGroup title={t("settings.model")}>
      <AppSelect
        value={form.model}
        onChange={selectModel}
        options={props.models.map((item) => ({ value: item.modelCode, label: item.modelName }))}
      />
    </SettingGroup>
  );

  const durationValue = form.duration ?? params?.durationMin ?? 1;
  let durationControl = (
    <div className={styles.videoPage__optionGridThree}>
      {durations.map((duration) => (
        <Option
          key={duration}
          active={form.duration === duration}
          onClick={() => updateForm({ duration })}
        >
          {t("seconds", { seconds: duration })}
        </Option>
      ))}
    </div>
  );
  if (isDurationSlider) {
    durationControl = (
      <div className={styles.videoPage__durationControl}>
        <input
          type="range"
          min={params?.durationMin ?? 1}
          max={params?.durationMax ?? 15}
          step={1}
          value={durationValue}
          onChange={(event) => updateForm({ duration: Number(event.target.value) })}
          aria-label={t("settings.durationLabel")}
        />
        <output>{t("seconds", { seconds: durationValue })}</output>
      </div>
    );
  }

  let referenceTitle = t("settings.reference");
  if (maxReferences > 1) {
    referenceTitle = t("settings.referenceCount", {
      count: form.references.length,
      max: maxReferences,
    });
  }

  let priceText = "";
  if (estimate) {
    priceText = t("settings.priceDetail", {
      total: estimate.requiredPoints,
      billing: estimate.billingUnit === "request" ? "request" : "second",
      unit: estimate.unitPoints,
      seconds: estimate.durationSeconds ?? form.duration ?? 0,
      refs: estimate.referencePoints ? (estimate.referenceCount ?? 0) : 0,
      refPoints: estimate.unitReferencePoints ?? 0,
    });
  }
  const priceLine = priceText ? (
    <p className={styles.videoPage__price} title={priceText}>
      {priceText}
    </p>
  ) : null;

  const optionGroups = (
    <>
      <SettingGroup title={t("settings.mode")}>
        <div className={styles.videoPage__optionGridThree}>
          {modes.map((mode) => (
            <Option key={mode} active={form.mode === mode} onClick={() => selectMode(mode)}>
              {text.modeLabel(mode)}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title={t("settings.duration")}>{durationControl}</SettingGroup>

      {canUseReferenceImage ? (
        <SettingGroup title={referenceTitle} hint={t("settings.referenceHint")}>
          <VideoReferences
            references={form.references}
            maxCount={maxReferences}
            pending={pendingReferences}
            isUploading={isUploading}
            onUpload={uploadReferences}
            onRemove={removeReference}
          />
          {referenceError ? (
            <p className={styles.videoPage__referenceError} role="alert">
              {referenceError}
            </p>
          ) : null}
        </SettingGroup>
      ) : null}

      <SettingGroup title={t("settings.ratio")}>
        <div className={styles.videoPage__optionGridThree}>
          {params?.ratios.map((ratio) => (
            <Option key={ratio} active={form.ratio === ratio} onClick={() => updateForm({ ratio })}>
              {ratio}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title={t("settings.resolution")}>
        <div className={styles.videoPage__optionGridTwo}>
          {resolutions.map((resolution) => (
            <Option
              key={resolution}
              active={form.resolution === resolution}
              onClick={() => updateForm({ resolution })}
            >
              {text.resolutionLabel(resolution)}
            </Option>
          ))}
        </div>
      </SettingGroup>
    </>
  );

  const submitButton = (
    <button
      type="button"
      className={styles.videoPage__submitButton}
      disabled={isSubmitting || isUploading}
      onClick={submit}
    >
      <Sparkles size={16} />
      {isSubmitting ? t("settings.submitting") : t("settings.submit")}
    </button>
  );

  if (isMobile) {
    const summary = [
      model?.modelName,
      form.mode === "image_to_video" ? text.modeLabel(form.mode) : "",
      form.ratio,
      form.resolution ? text.resolutionLabel(form.resolution) : "",
      form.duration === null ? "" : t("durationShort", { seconds: form.duration }),
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <section className={styles.videoPage__composer} aria-label={t("settings.label")}>
        <textarea
          ref={promptRef}
          className={clsx(styles.videoPage__textarea, styles.videoPage__composerPrompt)}
          rows={2}
          value={form.prompt}
          onChange={(event) => updateForm({ prompt: event.target.value })}
          onPaste={pasteReferences}
          placeholder={t("settings.promptPlaceholder")}
          aria-label={t("settings.prompt")}
        />
        <div className={styles.videoPage__composerBar}>
          <button
            type="button"
            className={styles.videoPage__composerSettings}
            onClick={() => setSheetOpen(true)}
            aria-haspopup="dialog"
            title={summary}
          >
            <SlidersHorizontal size={16} />
            <span className={styles.videoPage__composerSummary}>
              <span className={styles.videoPage__composerLabel}>{t("settings.open")}</span>
              <span className={styles.videoPage__composerValue}>{summary}</span>
            </span>
          </button>
          <PolishButton polish={polish} tooltipAlign="end" disabled={isSubmitting} />
          {submitButton}
        </div>
        {message ? <p className={styles.videoPage__composerMessage}>{message}</p> : priceLine}

        <Sheet
          open={isSheetOpen}
          onClose={() => setSheetOpen(false)}
          title={t("settings.title")}
          className={styles.videoPage__sheet}
          footer={
            <button
              type="button"
              className={clsx("btn-primary", styles.videoPage__sheetDone)}
              onClick={() => setSheetOpen(false)}
            >
              {t("settings.done")}
            </button>
          }
        >
          <div className={styles.videoPage__sheetBody}>
            {modelGroup}
            {optionGroups}
          </div>
        </Sheet>
      </section>
    );
  }

  return (
    <aside className={styles.videoPage__settings} aria-label={t("settings.label")}>
      {modelGroup}

      <SettingGroup title={t("settings.prompt")}>
        <div className={styles.videoPage__promptField}>
          <textarea
            ref={promptRef}
            className={clsx(
              styles.videoPage__textarea,
              polish.isEnabled && styles.videoPage__textareaWithPolish,
            )}
            rows={5}
            value={form.prompt}
            onChange={(event) => updateForm({ prompt: event.target.value })}
            onPaste={pasteReferences}
            placeholder={t("settings.promptPlaceholder")}
          />
          <PolishButton
            polish={polish}
            size="compact"
            tooltipAlign="end"
            disabled={isSubmitting}
            className={styles.videoPage__promptPolish}
          />
        </div>
      </SettingGroup>

      {optionGroups}

      <section className={styles.videoPage__submitBlock}>
        {submitButton}
        {priceLine}
        {message ? <p className={styles.videoPage__settingHint}>{message}</p> : null}
      </section>
    </aside>
  );
}

function SettingGroup(props: SettingGroupProps) {
  const title = props.title;
  const children = props.children;
  const hint = props.hint;

  return (
    <section className={styles.videoPage__settingBlock}>
      <div className={styles.videoPage__settingHeader}>
        <h2 className={styles.videoPage__settingTitle}>{title}</h2>
      </div>
      <div className={styles.videoPage__settingContent}>{children}</div>
      {hint ? <p className={styles.videoPage__settingHint}>{hint}</p> : null}
    </section>
  );
}

function Option(props: OptionProps) {
  const active = props.active;
  const children = props.children;
  const onClick = props.onClick;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(styles.videoPage__option, active && styles.videoPage__optionActive)}
    >
      {children}
    </button>
  );
}
