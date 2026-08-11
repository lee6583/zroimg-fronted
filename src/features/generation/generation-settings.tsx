"use client";

import clsx from "clsx";
import type { ReactNode } from "react";
import { AppSelect } from "@/components/ui/app-select";
import type {
  GenerationMode,
  GenerationModelOption,
  GenerationQualityOption,
} from "@/types/generation";
import { normalizeOptions, type GenerationOptions } from "./generation-model";
import styles from "./generate-form.module.css";

type GenerationSettingsProps = {
  value: GenerationOptions;
  estimate: number;
  isEstimating: boolean;
  modelOptions: GenerationModelOption[];
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
  const isEstimating = props.isEstimating;
  const modelOptions = props.modelOptions;
  const onChange = props.onChange;
  const model = modelOptions.find((item) => item.value === value.model);
  const params = model?.params[value.mode];
  const availableModels = modelOptions.filter((item) => item.modes.includes(value.mode));
  const availableModes = getAvailableModes(modelOptions);

  if (!params) {
    return null;
  }

  function update<Key extends keyof GenerationOptions>(
    key: Key,
    nextValue: GenerationOptions[Key],
  ) {
    const nextOptions = { ...value, [key]: nextValue };
    onChange(normalizeOptions(nextOptions, modelOptions));
  }

  return (
    <aside className={styles.generateForm__settingsPanel}>
      <SettingGroup title="模式">
        <div className={styles.generateForm__optionGridTwo}>
          {availableModes.map((mode) => (
            <Option key={mode} active={value.mode === mode} onClick={() => update("mode", mode)}>
              {mode === "edit" ? "图生图" : "文生图"}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title="模型">
        <AppSelect
          value={value.model}
          onChange={(model) => update("model", model)}
          options={availableModels.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
        />
      </SettingGroup>

      <SettingGroup title="比例">
        <div className={styles.generateForm__optionGridThree}>
          {params.ratios.map((ratio) => (
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

      <SettingGroup title="画质">
        <div className={styles.generateForm__optionGridFour}>
          {params.qualities.map((quality) => (
            <Option
              key={quality}
              active={value.quality === quality}
              onClick={() => update("quality", quality)}
            >
              {qualityLabel(quality)}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup
        title="生成数量"
        hint={isEstimating ? "正在计算积分" : `预计消耗 ${estimate} 积分`}
      >
        <div className={styles.generateForm__optionGridThree}>
          {params.counts.map((count) => (
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

function getAvailableModes(models: GenerationModelOption[]) {
  const modes: GenerationMode[] = [];
  const hasTextMode = models.some((model) => model.modes.includes("text"));
  const hasEditMode = models.some((model) => model.modes.includes("edit"));

  if (hasTextMode) {
    modes.push("text");
  }
  if (hasEditMode) {
    modes.push("edit");
  }

  return modes;
}

function qualityLabel(quality: GenerationQualityOption) {
  const labels: Record<string, string> = {
    auto: "自动",
    low: "低",
    medium: "中",
    high: "高",
  };
  return labels[quality] || quality;
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
