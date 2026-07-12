"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { AppSelect } from "@/components/ui/app-select";
import { generationBaseCredits } from "@/utils/generation-credits";
import {
  formats,
  imageCounts,
  modelOptions,
  qualities,
  ratios,
  resolutions,
  type GenerationOptions,
} from "./generation-model";
import styles from "./generate-form.module.css";

type GenerationSettingsProps = {
  value: GenerationOptions;
  estimate: number;
  onChange: (value: GenerationOptions) => void;
};

type OptionProps = {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
};

type SettingGroupProps = {
  title: string;
  children: ReactNode;
  hint?: string;
};

export function GenerationSettings(props: GenerationSettingsProps) {
  const value = props.value;
  const estimate = props.estimate;
  const onChange = props.onChange;

  function update<Key extends keyof GenerationOptions>(
    key: Key,
    nextValue: GenerationOptions[Key],
  ) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <aside className={styles.generateForm__settingsPanel}>
      <SettingGroup title="模式">
        <div className={styles.generateForm__optionGridTwo}>
          <Option active={value.mode === "text"} onClick={() => update("mode", "text")}>
            文生图
          </Option>
          <Option active={value.mode === "edit"} onClick={() => update("mode", "edit")}>
            图生图
          </Option>
        </div>
      </SettingGroup>

      <SettingGroup title="模型" hint={`每次基础消耗 ${generationBaseCredits[value.mode]} 积分`}>
        <AppSelect
          value={value.model}
          onChange={(model) => update("model", model)}
          triggerClassName={styles.generateForm__selectTrigger}
          options={modelOptions.map((option) => ({
            value: option.value,
            label: `${option.label} · ${generationBaseCredits[value.mode]}`,
          }))}
        />
      </SettingGroup>

      <SettingGroup title="比例">
        <div className={styles.generateForm__optionGridThree}>
          {ratios.map((ratio) => (
            <Option
              key={ratio}
              active={value.ratio === ratio}
              onClick={() => update("ratio", ratio)}
            >
              {ratio}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="分辨率">
        <div className={styles.generateForm__optionGridThree}>
          {resolutions.map((resolution) => (
            <Option
              key={resolution}
              active={value.resolution === resolution}
              onClick={() => update("resolution", resolution)}
            >
              {resolution}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="画质">
        <div className={styles.generateForm__optionGridFour}>
          {qualities.map((quality) => (
            <Option
              key={quality.value}
              active={value.quality === quality.value}
              onClick={() => update("quality", quality.value)}
            >
              {quality.label}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="图片格式">
        <div className={styles.generateForm__optionGridThree}>
          {formats.map((format) => (
            <Option
              key={format.value}
              active={value.format === format.value}
              onClick={() => update("format", format.value)}
            >
              {format.label}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="生成数量" hint={`预计消耗 ${estimate} 积分`}>
        <div className={styles.generateForm__optionGridThree}>
          {imageCounts.map((count) => (
            <Option
              key={count}
              active={value.count === count}
              onClick={() => update("count", count)}
            >
              {count}
            </Option>
          ))}
        </div>
      </SettingGroup>
    </aside>
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
      className={clsx(
        styles.generateForm__compactOption,
        active && styles.generateForm__compactOptionActive,
      )}
    >
      {children}
    </button>
  );
}

function SettingGroup(props: SettingGroupProps) {
  const title = props.title;
  const children = props.children;
  const hint = props.hint;

  return (
    <section className={styles.generateForm__settingGroup}>
      <h2 className={styles.generateForm__settingTitle}>{title}</h2>
      <div className={styles.generateForm__settingContent}>{children}</div>
      {hint ? <p className={styles.generateForm__settingHint}>{hint}</p> : null}
    </section>
  );
}
