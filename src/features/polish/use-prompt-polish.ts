"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type RefObject } from "react";
import { promptPolishApi } from "@/api/generation/polish";
import { useRouter } from "@/i18n/navigation";
import { translateApiError } from "@/i18n/api-error";
import type { PromptPolishConfig, PromptPolishScene } from "@/types/generation";
import { ApiRequestError } from "@/utils/request";

type UsePromptPolishOptions = {
  scene: PromptPolishScene;
  prompt: string;
  // 用润色结果替换输入框内容（受控状态的写入方式与输入时相同）
  onApply: (prompt: string) => void;
  // 提示文案，接入页面已有的提示区域
  onNotice: (text: string) => void;
  // 成功后同步页面内的积分余额；顶部导航的余额由 router.refresh() 刷新
  onBalance?: (points: number) => void;
  // 输入法组字期间不覆盖输入框，等组字结束再写入
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
};

// Java 积分不足时可能只返回固定 message（尚无 errorCode）
const insufficientPointsMessage = "积分不足";
// 约定的「未配置 / 已关闭」错误码；收到后隐藏按钮
const notConfiguredCodes = new Set(["PROMPT_POLISH_NOT_CONFIGURED", "PROMPT_POLISH_DISABLED"]);

// 同一页面（画布多个节点）共用一次配置请求
let configRequest: Promise<PromptPolishConfig> | null = null;
const configListeners = new Set<(config: PromptPolishConfig | null) => void>();

function loadConfig() {
  if (!configRequest) {
    configRequest = promptPolishApi.fetchConfig().catch((error: unknown) => {
      configRequest = null;
      throw error;
    });
  }

  return configRequest;
}

function disableConfig() {
  const disabled: PromptPolishConfig = { enabled: false, imagePoints: 0, videoPoints: 0 };
  configRequest = Promise.resolve(disabled);
  configListeners.forEach((listener) => listener(disabled));
}

function isNotConfigured(error: unknown) {
  return error instanceof ApiRequestError && notConfiguredCodes.has(error.errorCode ?? "");
}

/** AI 润色：读取开关与价格，调用润色接口并把结果写回输入框。 */
export function usePromptPolish(options: UsePromptPolishOptions) {
  const scene = options.scene;
  const prompt = options.prompt;
  const t = useTranslations("ui.polish");
  const tError = useTranslations("errors.api");
  const router = useRouter();
  const [config, setConfig] = useState<PromptPolishConfig | null>(null);
  const [isPolishing, setPolishing] = useState(false);
  const optionsRef = useRef(options);
  const pendingRef = useRef<string | null>(null);
  const isComposingRef = useRef(false);

  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    let isCurrent = true;
    configListeners.add(setConfig);
    loadConfig()
      .then((value) => {
        if (isCurrent) setConfig(value);
      })
      .catch(() => {
        // 读取失败时不显示按钮，不影响生成
      });

    return () => {
      isCurrent = false;
      configListeners.delete(setConfig);
    };
  }, []);

  useEffect(() => {
    function isTarget(event: Event) {
      const element = optionsRef.current.textareaRef?.current;
      return Boolean(element) && event.target === element;
    }

    function onStart(event: Event) {
      if (isTarget(event)) isComposingRef.current = true;
    }

    function onEnd(event: Event) {
      if (!isTarget(event)) return;

      isComposingRef.current = false;
      // 等组字的最后一次 input 写入受控状态后再替换
      window.setTimeout(() => {
        const pending = pendingRef.current;
        if (pending === null || isComposingRef.current) return;

        pendingRef.current = null;
        optionsRef.current.onApply(pending);
      }, 0);
    }

    document.addEventListener("compositionstart", onStart, true);
    document.addEventListener("compositionend", onEnd, true);
    return () => {
      document.removeEventListener("compositionstart", onStart, true);
      document.removeEventListener("compositionend", onEnd, true);
    };
  }, []);

  const isEnabled = Boolean(config?.enabled);
  const points = scene === "video" ? (config?.videoPoints ?? 0) : (config?.imagePoints ?? 0);

  function apply(value: string) {
    if (isComposingRef.current) {
      pendingRef.current = value;
      return;
    }

    optionsRef.current.onApply(value);
  }

  async function polish() {
    if (isPolishing) return;

    const text = prompt.trim();
    if (!text) {
      optionsRef.current.onNotice(t("empty"));
      return;
    }

    setPolishing(true);
    try {
      const result = await promptPolishApi.polish({ prompt: text, scene });
      apply(result.prompt);
      optionsRef.current.onBalance?.(result.balancePoints);
      router.refresh();
    } catch (error) {
      if (isNotConfigured(error)) {
        optionsRef.current.onNotice(t("notConfigured"));
        disableConfig();
        return;
      }
      if (error instanceof Error && error.message === insufficientPointsMessage) {
        optionsRef.current.onNotice(tError("pointsInsufficient"));
        return;
      }

      optionsRef.current.onNotice(translateApiError(error, tError));
    } finally {
      setPolishing(false);
    }
  }

  return { isEnabled, points, isPolishing, polish };
}

export type PromptPolish = ReturnType<typeof usePromptPolish>;
