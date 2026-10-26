"use client";

import clsx from "clsx";
import { LoaderCircle, Sparkles, Trash2, X } from "lucide-react";
import { Handle, NodeToolbar, Position, type NodeProps } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";
import { generationTasksApi } from "@/api/generation/tasks";
import { AppSelect } from "@/components/ui/app-select";
import { modeLabels } from "@/features/generation/generation-model";
import { useClock } from "@/features/generation/use-clock";
import type { CanvasGeneratorData } from "@/types/canvas";
import { getErrorMessage } from "@/utils/error";
import { getImageResolutionLabel } from "@/utils/generation-quality";
import { userAssetUrl } from "@/utils/media";
import { getTaskStatusLabel, isTaskRetrying } from "@/utils/task-status";
import { useCanvasActions } from "../canvas-context";
import {
  generatorNodeWidth,
  getMode,
  getModeModels,
  getReferenceId,
  getUpstreamImage,
  isTaskWaiting,
  resolveOptions,
  type GeneratorNode,
  type GeneratorOptions,
} from "../canvas-model";
import { useCanvasStore, useCanvasStoreApi } from "../canvas-store";
import styles from "../canvas-editor.module.css";

type RetryTextProps = {
  data: CanvasGeneratorData;
};

type Estimate = {
  points: number | null;
  error: string;
};

export function CanvasGeneratorNode(props: NodeProps<GeneratorNode>) {
  const id = props.id;
  const data = props.data;
  const selected = props.selected;
  const width = props.width;
  const actions = useCanvasActions();
  const models = actions.models;
  const balance = actions.balance;
  const setBalance = actions.setBalance;

  const store = useCanvasStoreApi();
  const upstream = useCanvasStore((state) => getUpstreamImage(id, state.nodes, state.edges));
  const focusId = useCanvasStore((state) => state.focusId);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [estimate, setEstimate] = useState<Estimate>({ points: null, error: "" });
  const [isSubmitting, setSubmitting] = useState(false);

  const mode = getMode(data, upstream);
  const referenceId = getReferenceId(data, upstream);
  const options = resolveOptions(data, models, mode);
  const modeModels = getModeModels(models, mode);
  const model = modeModels.find((item) => item.modelCode === options?.modelCode);
  const isPending = isTaskWaiting(data);
  const needsReference = mode !== "text_to_image";
  const isMissingReference = needsReference && !referenceId;
  const isShort = estimate.points !== null && estimate.points > balance;
  const canGenerate =
    !isPending && !isSubmitting && Boolean(data.prompt.trim()) && Boolean(options);

  const modelCode = options?.modelCode ?? "";
  const ratio = options?.ratio ?? "";
  const quality = options?.quality ?? "";
  const count = options?.count ?? 0;

  useEffect(() => {
    // 节点测量完成前处于隐藏状态，无法获得焦点
    if (focusId !== id || !width) return;

    promptRef.current?.focus();
    store.getState().setFocus(null);
  }, [focusId, id, store, width]);

  useEffect(() => {
    if (!modelCode) return;

    let isCurrent = true;
    const timer = window.setTimeout(async () => {
      try {
        const price = await generationTasksApi.estimatePrice({
          modelCode,
          mode,
          ratio,
          quality,
          count,
        });
        if (!isCurrent) return;

        setEstimate({ points: price.requiredPoints, error: "" });
        setBalance(price.currentPoints);
      } catch (error) {
        if (isCurrent) setEstimate({ points: null, error: getErrorMessage(error) });
      }
    }, 400);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [count, mode, modelCode, quality, ratio, setBalance]);

  function update(patch: Partial<GeneratorOptions>) {
    if (!options) return;

    const next = resolveOptions({ ...options, ...patch }, models, mode);
    if (!next) return;

    const state = store.getState();
    state.record();
    state.updateData(id, next);
  }

  function changePrompt(value: string) {
    store.getState().updateData(id, { prompt: value });
  }

  function removeMask() {
    const state = store.getState();
    state.record();
    state.updateData(id, { maskMediaId: null, referenceMediaId: null });
  }

  async function submit() {
    setSubmitting(true);
    try {
      await actions.generate(id);
    } finally {
      setSubmitting(false);
    }
  }

  const status = data.status;
  const isRetrying = isPending && isTaskRetrying({ ...data.retry, status: status ?? "" });

  let priceText = "";
  if (estimate.points !== null) {
    priceText = `预计 ${estimate.points} 积分 · 余额 ${balance}`;
  }

  return (
    <div
      className={clsx(styles.node, styles.generatorNode, selected && styles.nodeSelected)}
      style={{ width: generatorNodeWidth }}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <div className={styles.nodeToolbar}>
          <button
            type="button"
            className={clsx(styles.nodeToolbar__button, styles.nodeToolbar__danger)}
            onClick={() => actions.remove(id)}
          >
            <Trash2 size={14} />
            删除
          </button>
        </div>
      </NodeToolbar>

      <Handle type="target" position={Position.Left} className={styles.handle} />

      <header className={styles.generatorNode__header}>
        <span className={styles.generatorNode__title}>
          <Sparkles size={14} />
          {modeLabels[mode]}
        </span>
        {status ? (
          <span
            className={clsx(
              styles.badge,
              isPending && styles.badgeActive,
              isRetrying && styles.badgeWarning,
              status === "failed" && styles.badgeDanger,
            )}
          >
            {isPending ? <LoaderCircle size={12} className={styles.spin} /> : null}
            {isRetrying ? <RetryText data={data} /> : getTaskStatusLabel({ status })}
          </span>
        ) : null}
      </header>

      {referenceId ? (
        <div className={styles.generatorNode__refs}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.generatorNode__thumb}
            src={userAssetUrl(referenceId)}
            alt="参考图"
          />
          {data.maskMediaId ? (
            <span className={styles.generatorNode__maskThumb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={styles.generatorNode__thumb}
                src={userAssetUrl(data.maskMediaId)}
                alt="蒙版"
              />
              <button
                type="button"
                aria-label="移除蒙版"
                title="移除蒙版"
                className={clsx("nodrag", styles.generatorNode__thumbRemove)}
                onClick={removeMask}
              >
                <X size={12} />
              </button>
            </span>
          ) : null}
        </div>
      ) : null}
      {isMissingReference ? <p className={styles.generatorNode__error}>参考图未就绪</p> : null}

      <textarea
        ref={promptRef}
        className={clsx("nodrag nowheel", styles.generatorNode__prompt)}
        value={data.prompt}
        placeholder="描述你想生成的画面"
        rows={4}
        maxLength={2000}
        onFocus={() => store.getState().record()}
        onChange={(event) => changePrompt(event.target.value)}
      />

      {options && model ? (
        <div className={clsx("nodrag", styles.generatorNode__settings)}>
          <AppSelect
            value={modelCode}
            onChange={(value) => update({ modelCode: value })}
            options={modeModels.map((item) => ({ value: item.modelCode, label: item.modelName }))}
          />
          <div className={styles.generatorNode__settingRow}>
            <AppSelect
              value={ratio}
              onChange={(value) => update({ ratio: value })}
              options={model.supportParams.ratios.map((item) => ({ value: item, label: item }))}
            />
            <AppSelect
              value={quality}
              onChange={(value) => update({ quality: value })}
              options={model.supportParams.qualities.map((item) => ({
                value: item,
                label: getImageResolutionLabel(item),
              }))}
            />
            <AppSelect
              value={String(count)}
              onChange={(value) => update({ count: Number(value) })}
              options={model.supportParams.counts.map((item) => ({
                value: String(item),
                label: `${item} 张`,
              }))}
            />
          </div>
        </div>
      ) : (
        <p className={styles.generatorNode__error}>{modeLabels[mode]}暂无可用模型</p>
      )}

      {data.status === "failed" && data.failReason ? (
        <p className={styles.generatorNode__error}>{data.failReason}</p>
      ) : null}

      <footer className={styles.generatorNode__footer}>
        <span className={clsx(styles.generatorNode__price, isShort && styles.textDanger)}>
          {estimate.error || priceText}
        </span>
        <button
          type="button"
          className={clsx("nodrag", styles.primaryButton)}
          disabled={!canGenerate || isMissingReference}
          onClick={submit}
        >
          {isSubmitting ? <LoaderCircle size={14} className={styles.spin} /> : null}
          生成
        </button>
      </footer>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className={styles.handleHidden}
      />
    </div>
  );
}

// 重试等待期间每秒刷新倒计时
function RetryText(props: RetryTextProps) {
  const data = props.data;
  const now = useClock();

  return getTaskStatusLabel({ ...data.retry, status: data.status ?? "" }, now || undefined);
}
