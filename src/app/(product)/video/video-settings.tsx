"use client";

import clsx from "clsx";
import { ImagePlus, Mic2, Sparkles, X } from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import { useState } from "react";
import { generationTasksApi } from "@/api/generation/tasks";
import { videoApi } from "@/api/video";
import { AppSelect } from "@/components/ui/app-select";
import { getErrorMessage } from "@/utils/error";
import type { VideoModel } from "@/types/video";
import styles from "./video.module.css";

type VideoForm = {
  model: string;
  prompt: string;
  mode: string;
  duration: number | null;
  ratio: string;
  resolution: string;
  quality: string;
  audio: boolean;
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
  return models.find((model) => model.value === modelCode) || null;
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
      quality: "",
      audio: false,
      referenceMediaId: "",
      referenceFileName: "",
    };
  }

  const params = model.params;
  const mode = model.modes[0]?.value || "";

  return {
    model: model.value,
    prompt,
    mode,
    duration: firstNumber(params.durations, params.defaults.duration),
    ratio: firstText(params.ratios, params.defaults.ratio),
    resolution: firstText(params.resolutions, params.defaults.resolution),
    quality: firstText(params.qualities, params.defaults.quality),
    audio: params.defaults.audio ?? params.audios[0] ?? false,
    referenceMediaId: "",
    referenceFileName: "",
  };
}

function displayMode(mode: string) {
  if (mode === "text_to_video") {
    return "文生视频";
  }
  if (mode === "image_to_video") {
    return "图生视频";
  }
  return mode;
}

export function VideoSettings(props: VideoSettingsProps) {
  const firstModel = props.models[0] || null;
  const [form, setForm] = useState(() => createForm(firstModel));
  const [message, setMessage] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [isUploading, setUploading] = useState(false);

  const model = getModel(props.models, form.model);
  const params = model?.params || null;
  const canUseReferenceImage = form.mode === "image_to_video";
  const hasAudioOptions = Boolean(params && params.audios.length > 0);

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

  function selectMode(mode: string) {
    const shouldClearReference = mode !== "image_to_video";
    updateForm({
      mode,
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

    const data = new FormData();
    data.set("file", file);

    try {
      setUploading(true);
      setMessage("");
      const result = await generationTasksApi.uploadMedia(data);
      updateForm({
        referenceMediaId: result.media.id,
        referenceFileName: result.media.fileName || file.name,
      });
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!model || !params) {
      setMessage("视频服务暂未配置");
      return;
    }
    if (!form.prompt.trim()) {
      setMessage("请输入视频提示词");
      return;
    }
    if (!form.mode || !form.ratio || !form.resolution || !form.quality || form.duration === null) {
      setMessage("视频参数尚未配置完整");
      return;
    }
    if (canUseReferenceImage && !form.referenceMediaId) {
      setMessage("图生视频需要上传参考图片");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const priceData = await videoApi.estimate({
        modelCode: form.model,
        mode: form.mode as "text_to_video" | "image_to_video",
        ratio: form.ratio,
        resolution: form.resolution,
        quality: form.quality,
        durationSeconds: form.duration,
        audio: form.audio,
      });

      if (!priceData.price.enough) {
        setMessage(`积分不足，还需要 ${priceData.price.shortagePoints} 积分`);
        return;
      }

      await videoApi.createTask({
        modelCode: form.model,
        mode: form.mode as "text_to_video" | "image_to_video",
        prompt: form.prompt.trim(),
        ratio: form.ratio,
        resolution: form.resolution,
        quality: form.quality,
        durationSeconds: form.duration,
        audio: form.audio,
        priceVersion: priceData.price.priceVersion,
        referenceMediaId: canUseReferenceImage ? form.referenceMediaId : undefined,
      });
      await props.onCreated();
      setMessage("任务已提交");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <aside className={styles.videoPage__settings} aria-label="视频生成参数">
      <SettingGroup title="模型">
        <AppSelect
          value={form.model}
          onChange={selectModel}
          options={props.models.map((item) => ({ value: item.value, label: item.label }))}
        />
      </SettingGroup>

      <SettingGroup title="提示词">
        <textarea
          className={styles.videoPage__textarea}
          rows={5}
          value={form.prompt}
          onChange={(event) => updateForm({ prompt: event.target.value })}
          placeholder="描述你想生成的视频画面，例如：雨夜霓虹街道上，一辆黑色跑车缓慢驶过，电影感镜头。"
        />
      </SettingGroup>

      <SettingGroup title="生成模式">
        <div className={styles.videoPage__optionGridThree}>
          {model?.modes.map((item) => (
            <Option
              key={item.value}
              active={form.mode === item.value}
              onClick={() => selectMode(item.value)}
            >
              {item.label || displayMode(item.value)}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="时长">
        <div className={styles.videoPage__optionGridThree}>
          {params?.durations.map((duration) => (
            <Option
              key={duration}
              active={form.duration === duration}
              onClick={() => updateForm({ duration })}
            >
              {duration}s
            </Option>
          ))}
        </div>
      </SettingGroup>

      {canUseReferenceImage ? (
        <SettingGroup title="参考图" hint="仅支持 PNG、JPEG、WebP，最大 10 MB">
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
              <span>{isUploading ? "上传中..." : form.referenceFileName || "上传参考图"}</span>
            </label>
            {form.referenceMediaId ? (
              <button
                type="button"
                className={styles.videoPage__clearUpload}
                onClick={() => updateForm({ referenceMediaId: "", referenceFileName: "" })}
                aria-label="移除参考图"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </SettingGroup>
      ) : null}

      <SettingGroup title="画面比例">
        <div className={styles.videoPage__optionGridThree}>
          {params?.ratios.map((ratio) => (
            <Option key={ratio} active={form.ratio === ratio} onClick={() => updateForm({ ratio })}>
              {ratio}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="分辨率">
        <div className={styles.videoPage__optionGridTwo}>
          {params?.resolutions.map((resolution) => (
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

      <SettingGroup title="画质">
        <div className={styles.videoPage__optionGridThree}>
          {params?.qualities.map((quality) => (
            <Option
              key={quality}
              active={form.quality === quality}
              onClick={() => updateForm({ quality })}
            >
              {quality}
            </Option>
          ))}
        </div>
      </SettingGroup>

      {hasAudioOptions ? (
        <SettingGroup title="音频">
          <button
            type="button"
            aria-pressed={form.audio}
            onClick={() => updateForm({ audio: !form.audio })}
            className={styles.videoPage__audioButton}
            disabled={params?.audios.length === 1}
          >
            <span className={styles.videoPage__audioCopy}>
              <Mic2 size={16} />
              {form.audio ? "生成音频" : "关闭音频"}
            </span>
            <span
              className={clsx(
                styles.videoPage__switch,
                form.audio && styles.videoPage__switchActive,
              )}
              aria-hidden="true"
            >
              <span className={styles.videoPage__switchThumb} />
            </span>
          </button>
        </SettingGroup>
      ) : null}

      <section className={styles.videoPage__submitBlock}>
        <button
          type="button"
          className={styles.videoPage__submitButton}
          disabled={isSubmitting || isUploading}
          onClick={submit}
        >
          <Sparkles size={16} />
          {isSubmitting ? "提交中..." : "生成视频"}
        </button>
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
        {hint ? <span className={styles.videoPage__settingHint}>{hint}</span> : null}
      </div>
      <div className={styles.videoPage__settingContent}>{children}</div>
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
      className={clsx(styles.videoPage__option, active && styles.videoPage__optionActive)}
    >
      {children}
    </button>
  );
}
