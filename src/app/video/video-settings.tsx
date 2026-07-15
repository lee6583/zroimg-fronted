"use client";

import clsx from "clsx";
import { ImagePlus, Mic2, Sparkles, UploadCloud } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { AppSelect } from "@/components/ui/app-select";
import styles from "./video.module.css";

type VideoModel = "auto" | "text-video" | "image-video";

type VideoForm = {
  model: VideoModel;
  prompt: string;
  mode: string;
  duration: string;
  ratio: string;
  resolution: string;
  audio: boolean;
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

const modelOptions = [
  { value: "auto", label: "自动（默认视频模型）" },
  { value: "text-video", label: "文本视频模型" },
  { value: "image-video", label: "图生视频模型" },
] satisfies Array<{ value: VideoModel; label: string }>;

const modeOptions = ["文生视频", "图生视频", "视频编辑"];
const durationOptions = ["5s", "8s", "10s"];
const ratioOptions = ["16:9", "9:16", "1:1"];
const resolutionOptions = ["720p", "1080p"];

const initialForm: VideoForm = {
  model: "auto",
  prompt: "",
  mode: "文生视频",
  duration: "8s",
  ratio: "16:9",
  resolution: "1080p",
  audio: false,
};

export function VideoSettings() {
  const [form, setForm] = useState(initialForm);

  function update<Key extends keyof VideoForm>(key: Key, value: VideoForm[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <aside className={styles.videoPage__settings} aria-label="视频生成参数">
      <SettingGroup title="模型">
        <AppSelect
          value={form.model}
          onChange={(model) => update("model", model)}
          options={modelOptions}
        />
      </SettingGroup>

      <SettingGroup title="提示词">
        <textarea
          className={styles.videoPage__textarea}
          rows={5}
          value={form.prompt}
          onChange={(event) => update("prompt", event.target.value)}
          placeholder="描述你想生成的视频画面，例如：雨夜霓虹街道上，一辆黑色跑车缓慢驶过，电影感镜头。"
        />
      </SettingGroup>

      <SettingGroup title="生成模式">
        <div className={styles.videoPage__optionGridThree}>
          {modeOptions.map((item) => (
            <Option key={item} active={form.mode === item} onClick={() => update("mode", item)}>
              {item}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="时长">
        <div className={styles.videoPage__optionGridThree}>
          {durationOptions.map((item) => (
            <Option
              key={item}
              active={form.duration === item}
              onClick={() => update("duration", item)}
            >
              {item}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="首尾帧与参考图" hint="可选">
        <div className={styles.videoPage__uploadGrid}>
          <button type="button" className={styles.videoPage__uploadBox}>
            <ImagePlus size={18} />
            <span>首帧图</span>
          </button>
          <button type="button" className={styles.videoPage__uploadBox}>
            <UploadCloud size={18} />
            <span>尾帧图</span>
          </button>
        </div>
      </SettingGroup>

      <SettingGroup title="画面比例">
        <div className={styles.videoPage__optionGridThree}>
          {ratioOptions.map((item) => (
            <Option key={item} active={form.ratio === item} onClick={() => update("ratio", item)}>
              {item}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="分辨率">
        <div className={styles.videoPage__optionGridTwo}>
          {resolutionOptions.map((item) => (
            <Option
              key={item}
              active={form.resolution === item}
              onClick={() => update("resolution", item)}
            >
              {item}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="生成音频">
        <button
          type="button"
          aria-pressed={form.audio}
          onClick={() => update("audio", !form.audio)}
          className={styles.videoPage__audioButton}
        >
          <span className={styles.videoPage__audioCopy}>
            <Mic2 size={16} />
            生成音频
          </span>
          <span
            className={clsx(styles.videoPage__switch, form.audio && styles.videoPage__switchActive)}
            aria-hidden="true"
          >
            <span className={styles.videoPage__switchThumb} />
          </span>
        </button>
      </SettingGroup>

      <section className={styles.videoPage__submitBlock}>
        <p className={styles.videoPage__settingHint}>预计消耗 40 积分</p>
        <button type="button" className={styles.videoPage__submitButton}>
          <Sparkles size={16} />
          生成视频
        </button>
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
