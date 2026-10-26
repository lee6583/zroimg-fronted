"use client";

import clsx from "clsx";
import { ImagePlus, SlidersHorizontal, Sparkles, X } from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";
import { uploadMediaFile } from "@/api/media/uploads";
import { AppSelect } from "@/components/ui/app-select";
import { Sheet, useIsMobile } from "@/components/ui/sheet";
import type { VideoGenerationMode, VideoModel } from "@/types/video";
import { isVideoMode, submitVideoTask } from "./video-submit";
import { useVideoText } from "./video-text";
import styles from "./video.module.css";

type VideoForm = {
  model: string;
  prompt: string;
  mode: VideoGenerationMode | "";
  duration: number | null;
  ratio: string;
  resolution: string;
  referenceMediaId: string;
  referenceFileName: string;
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

function createForm(model: VideoModel | null, prompt = ""): VideoForm {
  if (!model) {
    return {
      model: "",
      prompt,
      mode: "",
      duration: null,
      ratio: "",
      resolution: "",
      referenceMediaId: "",
      referenceFileName: "",
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
    referenceMediaId: "",
    referenceFileName: "",
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

  const model = getModel(props.models, form.model);
  const params = model?.supportParams || null;
  const modes = model?.supportModes.filter(isVideoMode) ?? [];
  const canUseReferenceImage = form.mode === "image_to_video";
  const resolutions = params?.resolutionsByMode[form.mode] ?? params?.resolutions ?? [];

  function updateForm(nextForm: Partial<VideoForm>) {
    setForm((currentForm) => ({
      ...currentForm,
      ...nextForm,
    }));
  }

  function selectModel(modelCode: string) {
    const nextModel = getModel(props.models, modelCode);
    setForm(createForm(nextModel, form.prompt));
    setMessage("");
  }

  function selectMode(mode: VideoGenerationMode) {
    const shouldClearReference = mode !== "image_to_video";
    const nextResolutions = params?.resolutionsByMode[mode] ?? params?.resolutions ?? [];
    updateForm({
      mode,
      resolution: firstText(nextResolutions, form.resolution),
      referenceMediaId: shouldClearReference ? "" : form.referenceMediaId,
      referenceFileName: shouldClearReference ? "" : form.referenceFileName,
    });
  }

  async function uploadReference(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setMessage("");
      const asset = await uploadMediaFile(file);
      updateForm({
        referenceMediaId: asset.id,
        referenceFileName: asset.originalName || file.name,
      });
    } catch (error) {
      setMessage(text.errorText(error));
    } finally {
      setUploading(false);
    }
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
    if (canUseReferenceImage && !form.referenceMediaId) {
      setMessage(t("errors.referenceRequired"));
      if (isMobile) {
        setSheetOpen(true);
      }
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      await submitVideoTask({
        model: form.model,
        mode: form.mode,
        prompt: form.prompt.trim(),
        ratio: form.ratio,
        resolution: form.resolution,
        duration: form.duration,
        referenceMediaId: canUseReferenceImage ? form.referenceMediaId : undefined,
      });
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

      <SettingGroup title={t("settings.duration")}>
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
      </SettingGroup>

      {canUseReferenceImage ? (
        <SettingGroup title={t("settings.reference")} hint={t("settings.referenceHint")}>
          <div className={styles.videoPage__uploadGrid}>
            <label
              className={clsx(
                styles.videoPage__uploadBox,
                form.referenceMediaId && styles.videoPage__uploadBoxActive,
              )}
            >
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={styles.videoPage__fileInput}
                onChange={uploadReference}
                disabled={isUploading}
              />
              <ImagePlus size={18} />
              <span title={form.referenceFileName || undefined}>
                {isUploading
                  ? t("settings.uploading")
                  : form.referenceFileName || t("settings.upload")}
              </span>
            </label>
            {form.referenceMediaId ? (
              <button
                type="button"
                className={styles.videoPage__clearUpload}
                onClick={() => updateForm({ referenceMediaId: "", referenceFileName: "" })}
                aria-label={t("settings.removeReference")}
                title={t("settings.removeReference")}
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
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
              {resolution}
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
      form.resolution,
      form.duration === null ? "" : t("durationShort", { seconds: form.duration }),
    ]
      .filter(Boolean)
      .join(" · ");

    return (
      <section className={styles.videoPage__composer} aria-label={t("settings.label")}>
        <textarea
          className={clsx(styles.videoPage__textarea, styles.videoPage__composerPrompt)}
          rows={2}
          value={form.prompt}
          onChange={(event) => updateForm({ prompt: event.target.value })}
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
          {submitButton}
        </div>
        {message ? <p className={styles.videoPage__composerMessage}>{message}</p> : null}

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
        <textarea
          className={styles.videoPage__textarea}
          rows={5}
          value={form.prompt}
          onChange={(event) => updateForm({ prompt: event.target.value })}
          placeholder={t("settings.promptPlaceholder")}
        />
      </SettingGroup>

      {optionGroups}

      <section className={styles.videoPage__submitBlock}>
        {submitButton}
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
