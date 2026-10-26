"use client";

import clsx from "clsx";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { AppSelect } from "@/components/ui/app-select";
import type { GenerationModel } from "@/types/generation";
import { getImageResolutionLabel } from "@/utils/generation-quality";
import {
  imageModes,
  normalizeOptions,
  supportsMode,
  type GenerationOptions,
} from "./generation-model";
import styles from "./generate-form.module.css";

type GenerationSettingsProps = {
  value: GenerationOptions;
  estimate: number;
  isEstimating: boolean;
  modelOptions: GenerationModel[];
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
  const t = useTranslations("generate");
  const tTask = useTranslations("task");
  const model = modelOptions.find((item) => item.modelCode === value.modelCode);
  const params = model?.supportParams;
  const availableModels = modelOptions.filter((item) => supportsMode(item, value.mode));
  const availableModes = imageModes.filter((mode) =>
    modelOptions.some((item) => supportsMode(item, mode)),
  );

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
      <SettingGroup title={t("settings.mode")}>
        <div className={styles.generateForm__optionGridTwo}>
          {availableModes.map((mode) => (
            <Option key={mode} active={value.mode === mode} onClick={() => update("mode", mode)}>
              {t(`modes.${mode}`)}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup title={t("settings.model")}>
        <AppSelect
          value={value.modelCode}
          onChange={(modelCode) => update("modelCode", modelCode)}
          options={availableModels.map((option) => ({
            value: option.modelCode,
            label: option.modelName,
          }))}
        />
      </SettingGroup>

      <SettingGroup title={t("settings.ratio")}>
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

      <SettingGroup title={t("settings.resolution")}>
        <div className={styles.generateForm__optionGridFour}>
          {params.qualities.map((quality) => (
            <Option
              key={quality}
              active={value.quality === quality}
              onClick={() => update("quality", quality)}
            >
              {getImageResolutionLabel(quality, tTask)}
            </Option>
          ))}
        </div>
      </SettingGroup>

      <SettingGroup
        title={t("settings.count")}
        hint={
          isEstimating ? t("settings.estimating") : t("settings.estimate", { points: estimate })
        }
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
