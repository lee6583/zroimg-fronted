"use client";

import clsx from "clsx";
import { getPastedImages } from "@/utils/clipboard-images";
import { LoaderCircle, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { Handle, NodeToolbar, Position, type NodeProps } from "@xyflow/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { generationTasksApi } from "@/api/generation/tasks";
import { AppSelect } from "@/components/ui/app-select";
import { useIsMobile } from "@/components/ui/sheet";
import { useClock } from "@/features/generation/use-clock";
import { PolishButton } from "@/features/polish/polish-button";
import { usePromptPolish } from "@/features/polish/use-prompt-polish";
import { translateApiError } from "@/i18n/api-error";
import type { CanvasGeneratorData } from "@/types/canvas";
import type { GenerationMode } from "@/types/generation";
import { getImageResolutionLabel } from "@/utils/generation-quality";
import { userAssetThumbnailUrl } from "@/utils/media";
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
import { useTextDraft } from "../text-draft";
import styles from "../canvas-editor.module.css";

type RetryTextProps = {
  data: CanvasGeneratorData;
};

type Estimate = {
  points: number | null;
  error: string;
};

type GeneratorFormProps = {
  id: string;
  data: CanvasGeneratorData;
  // node：节点内表单（桌面）；sheet：手机端 Sheet 内表单，控件更大。
  variant: "node" | "sheet";
  // 节点已完成测量（可见）时才能聚焦新建节点的提示词
  isMeasured?: boolean;
};

type GeneratorStatusProps = {
  data: CanvasGeneratorData;
};

type GeneratorRefsProps = {
  id: string;
  data: CanvasGeneratorData;
};

function useGeneratorMode(id: string, data: CanvasGeneratorData) {
  const upstream = useCanvasStore((state) => getUpstreamImage(id, state.nodes, state.edges));
  const mode: GenerationMode = getMode(data, upstream);
  const referenceId = getReferenceId(data, upstream);

  return { mode, referenceId };
}

export function CanvasGeneratorNode(props: NodeProps<GeneratorNode>) {
  const id = props.id;
  const data = props.data;
  const selected = props.selected;
  const width = props.width;
  const actions = useCanvasActions();
  const t = useTranslations("canvas.generator");
  const tMode = useTranslations("generate.modes");
  const isMobile = useIsMobile();

  const store = useCanvasStoreApi();
  const focusId = useCanvasStore((state) => state.focusId);
  const { mode } = useGeneratorMode(id, data);

  useEffect(() => {
    // 手机端新建节点后直接打开编辑 Sheet；桌面端由节点内表单聚焦提示词
    if (!isMobile || focusId !== id || !width) return;

    actions.openGenerator(id);
    store.getState().setFocus(null);
  }, [actions, focusId, id, isMobile, store, width]);

  return (
    <div
      className={clsx(
        styles.node,
        styles.generatorNode,
        selected && styles.nodeSelected,
        isMobile && styles.generatorNodeCompact,
      )}
      style={{ width: generatorNodeWidth }}
    >
      <NodeToolbar isVisible={selected} position={Position.Top} offset={10}>
        <div className={styles.nodeToolbar}>
          {isMobile ? (
            <button
              aria-label={t("edit")}
              title={t("edit")}
              type="button"
              className={styles.nodeToolbar__button}
              onClick={() => actions.openGenerator(id)}
            >
              <Pencil size={14} />
              <span className={styles.nodeToolbar__label}>{t("edit")}</span>
            </button>
          ) : null}
          <button
            aria-label={t("delete")}
            title={t("delete")}
            type="button"
            className={clsx(styles.nodeToolbar__button, styles.nodeToolbar__danger)}
            onClick={() => actions.remove(id)}
          >
            <Trash2 size={14} />
            <span className={styles.nodeToolbar__label}>{t("delete")}</span>
          </button>
        </div>
      </NodeToolbar>

      <Handle type="target" position={Position.Left} className={styles.handle} />

      <header className={styles.generatorNode__header}>
        <span className={styles.generatorNode__title}>
          <Sparkles size={14} />
          {tMode(mode)}
        </span>
        <GeneratorStatus data={data} />
      </header>

      {isMobile ? (
        <>
          <GeneratorRefs id={id} data={data} />
          <p
            className={clsx(
              styles.generatorNode__promptPreview,
              !data.prompt.trim() && styles.generatorNode__promptEmpty,
            )}
          >
            {data.prompt.trim() || t("emptyPrompt")}
          </p>
          {data.status === "failed" && data.failReason ? (
            <p className={styles.generatorNode__error}>{data.failReason}</p>
          ) : null}
        </>
      ) : (
        <GeneratorForm id={id} data={data} variant="node" isMeasured={Boolean(width)} />
      )}

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={false}
        className={styles.handleHidden}
      />
    </div>
  );
}

export function GeneratorStatus(props: GeneratorStatusProps) {
  const data = props.data;
  const tTask = useTranslations("task");
  const status = data.status;
  if (!status) return null;

  const isPending = isTaskWaiting(data);
  const isRetrying = isPending && isTaskRetrying({ ...data.retry, status });

  return (
    <span
      className={clsx(
        styles.badge,
        isPending && styles.badgeActive,
        isRetrying && styles.badgeWarning,
        status === "failed" && styles.badgeDanger,
      )}
    >
      {isPending ? <LoaderCircle size={12} className={styles.spin} /> : null}
      {isRetrying ? <RetryText data={data} /> : getTaskStatusLabel({ status }, tTask)}
    </span>
  );
}

function GeneratorRefs(props: GeneratorRefsProps) {
  const id = props.id;
  const data = props.data;
  const t = useTranslations("canvas.generator");
  const store = useCanvasStoreApi();
  const actions = useCanvasActions();
  const { referenceId } = useGeneratorMode(id, data);

  function removeMask() {
    const state = store.getState();
    state.record();
    state.updateData(id, { maskMediaId: null, referenceMediaId: null });
  }

  if (!referenceId) return null;

  const referenceImage = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={styles.generatorNode__thumb}
      src={userAssetThumbnailUrl(referenceId)}
      alt={t("reference")}
    />
  );
  if (!data.maskMediaId) {
    return <div className={styles.generatorNode__refs}>{referenceImage}</div>;
  }

  // 蒙版图只用于提交；节点上在原图上叠加高亮显示重绘区域，点击重新编辑蒙版
  const maskStyle = {
    "--mask-url": `url("${userAssetThumbnailUrl(data.maskMediaId)}")`,
  } as CSSProperties;

  return (
    <div className={styles.generatorNode__refs}>
      <span className={styles.generatorNode__maskThumb}>
        <button
          type="button"
          aria-label={t("editMask")}
          title={t("editMask")}
          className={clsx("nodrag", styles.generatorNode__maskEdit)}
          onClick={() => actions.editMask(id)}
        >
          {referenceImage}
          <span className={styles.generatorNode__maskOverlay} style={maskStyle} />
        </button>
        <button
          type="button"
          aria-label={t("removeMask")}
          title={t("removeMask")}
          className={clsx("nodrag", styles.generatorNode__thumbRemove)}
          onClick={removeMask}
        >
          <X size={12} />
        </button>
      </span>
    </div>
  );
}

/** 提示词、模型参数、估价和生成按钮；桌面端在节点内，手机端在 Sheet 内。 */
export function GeneratorForm(props: GeneratorFormProps) {
  const id = props.id;
  const data = props.data;
  const variant = props.variant;
  const isMeasured = props.isMeasured ?? false;
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const focusId = useCanvasStore((state) => state.focusId);
  // 提示词直接读 store：React Flow 节点 props 晚一帧，受控值落后会打断输入法组字
  const storedPrompt = useCanvasStore((state) => {
    const node = state.nodes.find((item) => item.id === id);
    return node?.type === "generator" ? node.data.prompt : data.prompt;
  });
  const actions = useCanvasActions();
  const models = actions.models;
  const balance = actions.balance;
  const setBalance = actions.setBalance;
  const t = useTranslations("canvas.generator");
  const tMode = useTranslations("generate.modes");
  const tNotice = useTranslations("canvas.notices");
  const tTask = useTranslations("task");
  const tError = useTranslations("errors.api");

  const store = useCanvasStoreApi();
  const { mode, referenceId } = useGeneratorMode(id, data);
  const [estimate, setEstimate] = useState<Estimate>({ points: null, error: "" });
  const [isSubmitting, setSubmitting] = useState(false);

  const options = resolveOptions(data, models, mode);
  const modeModels = getModeModels(models, mode);
  const model = modeModels.find((item) => item.modelCode === options?.modelCode);
  const isPending = isTaskWaiting(data);
  const needsReference = mode !== "text_to_image";
  const isMissingReference = needsReference && !referenceId;
  const isShort = estimate.points !== null && estimate.points > balance;
  const canGenerate =
    !isPending && !isSubmitting && Boolean(storedPrompt.trim()) && Boolean(options);
  const isSheet = variant === "sheet";

  const modelCode = options?.modelCode ?? "";
  const ratio = options?.ratio ?? "";
  const quality = options?.quality ?? "";
  const count = options?.count ?? 0;

  useEffect(() => {
    // 节点测量完成前处于隐藏状态，无法获得焦点
    if (variant !== "node" || focusId !== id || !isMeasured) return;

    promptRef.current?.focus();
    store.getState().setFocus(null);
  }, [focusId, id, isMeasured, store, variant]);

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
        if (isCurrent) setEstimate({ points: null, error: translateApiError(error, tError) });
      }
    }, 400);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [count, mode, modelCode, quality, ratio, setBalance, tError]);

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
  const promptDraft = useTextDraft(storedPrompt, changePrompt);
  // AI 润色：结果和输入一样写回画布数据，并记录一步撤销；组字期间延后写入
  const polish = usePromptPolish({
    scene: "image",
    prompt: storedPrompt,
    // 与生成时相同的参考图：图生图 / 局部重绘的原图（连线的图片节点或记录的原图）
    referenceMediaIds: mode === "text_to_image" ? [] : [referenceId],
    textareaRef: promptRef,
    onApply(value) {
      const state = store.getState();
      state.record();
      state.updateData(id, { prompt: value });
    },
    onNotice: actions.notify,
    onBalance: setBalance,
  });

  async function submit() {
    setSubmitting(true);
    try {
      await actions.generate(id);
    } finally {
      setSubmitting(false);
    }
  }

  let priceText = "";
  if (estimate.points !== null) {
    priceText = t("price", { points: estimate.points, balance });
  }

  const modelSelect = (
    <AppSelect
      value={modelCode}
      onChange={(value) => update({ modelCode: value })}
      options={modeModels.map((item) => ({ value: item.modelCode, label: item.modelName }))}
    />
  );
  const ratioSelect = model ? (
    <AppSelect
      value={ratio}
      onChange={(value) => update({ ratio: value })}
      options={model.supportParams.ratios.map((item) => ({ value: item, label: item }))}
    />
  ) : null;
  const qualitySelect = model ? (
    <AppSelect
      value={quality}
      onChange={(value) => update({ quality: value })}
      options={model.supportParams.qualities.map((item) => ({
        value: item,
        label: getImageResolutionLabel(item, tTask),
      }))}
    />
  ) : null;
  const countSelect = model ? (
    <AppSelect
      value={String(count)}
      onChange={(value) => update({ count: Number(value) })}
      options={model.supportParams.counts.map((item) => ({
        value: String(item),
        label: t("count", { count: item }),
      }))}
    />
  ) : null;

  return (
    <>
      <GeneratorRefs id={id} data={data} />
      {isMissingReference ? (
        <p className={styles.generatorNode__error}>{tNotice("referenceNotReady")}</p>
      ) : null}

      <textarea
        ref={promptRef}
        className={clsx(
          "nodrag nowheel nopan",
          styles.generatorNode__prompt,
          isSheet && styles.generatorNode__promptSheet,
        )}
        placeholder={t("placeholder")}
        aria-label={t("placeholder")}
        rows={4}
        onFocus={() => store.getState().record()}
        onKeyDown={(event) => event.stopPropagation()}
        onPaste={(event) => {
          // 粘贴图片：作为参考图节点接到当前生成节点，文字照常粘贴
          const images = getPastedImages(event.clipboardData);
          if (images.length === 0) return;
          event.preventDefault();
          actions.pasteImages(id, images);
        }}
        {...promptDraft}
      />

      {options && model ? (
        isSheet ? (
          <div className={styles.generatorSheet__settings}>
            <label className={styles.generatorSheet__field}>
              <span>{t("model")}</span>
              {modelSelect}
            </label>
            <div className={styles.generatorSheet__row}>
              <label className={styles.generatorSheet__field}>
                <span>{t("ratio")}</span>
                {ratioSelect}
              </label>
              <label className={styles.generatorSheet__field}>
                <span>{t("resolution")}</span>
                {qualitySelect}
              </label>
              <label className={styles.generatorSheet__field}>
                <span>{t("countLabel")}</span>
                {countSelect}
              </label>
            </div>
          </div>
        ) : (
          <div className={clsx("nodrag", styles.generatorNode__settings)}>
            {modelSelect}
            <div className={styles.generatorNode__settingRow}>
              {ratioSelect}
              {qualitySelect}
              {countSelect}
            </div>
          </div>
        )
      ) : (
        <p className={styles.generatorNode__error}>
          {tNotice("modeNoModel", { mode: tMode(mode) })}
        </p>
      )}

      {!isSheet && data.status === "failed" && data.failReason ? (
        <p className={styles.generatorNode__error}>{data.failReason}</p>
      ) : null}

      <footer
        className={clsx(styles.generatorNode__footer, isSheet && styles.generatorSheet__footer)}
      >
        <span className={clsx(styles.generatorNode__price, isShort && styles.textDanger)}>
          {estimate.error || priceText}
        </span>
        <PolishButton
          polish={polish}
          size={isSheet ? "default" : "compact"}
          tooltipAlign="end"
          disabled={isPending}
        />
        <button
          type="button"
          className={clsx("nodrag", styles.primaryButton, isSheet && styles.generatorSheet__submit)}
          disabled={!canGenerate || isMissingReference}
          onClick={submit}
        >
          {isSubmitting ? <LoaderCircle size={14} className={styles.spin} /> : null}
          {t("generate")}
        </button>
      </footer>
    </>
  );
}

// 重试等待期间每秒刷新倒计时
function RetryText(props: RetryTextProps) {
  const data = props.data;
  const tTask = useTranslations("task");
  const now = useClock();

  return getTaskStatusLabel({ ...data.retry, status: data.status ?? "" }, tTask, now || undefined);
}
