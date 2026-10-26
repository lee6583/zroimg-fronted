import { useState } from "react";
import type { ChangeEvent, CompositionEvent } from "react";

type TextDraft = {
  // 输入框显示的值，组字期间可以和画布数据不同
  draft: string;
  // 上一次从画布数据同步到的值，用来识别外部修改（撤销、重做等）
  source: string;
  isComposing: boolean;
};

function createTextDraft(value: string): TextDraft {
  return { draft: value, source: value, isComposing: false };
}

// 画布数据变化时决定是否覆盖输入框：输入法组字期间改写 value 会打断组字，拼音会被当成字母提交。
function syncTextDraft(state: TextDraft, value: string): TextDraft {
  if (value === state.source) {
    return state;
  }
  if (state.isComposing || value === state.draft) {
    return { ...state, source: value };
  }

  return { ...state, draft: value, source: value };
}

/**
 * 画布节点内的受控文本框。输入框只读本地草稿，组字结束、失焦或普通输入时才写回画布数据。
 * value 必须来自画布 store（同步更新），不能用 React Flow 传入的节点 props（会晚一帧）。
 */
function useTextDraft(value: string, commit: (value: string) => void) {
  const [state, setState] = useState(() => createTextDraft(value));
  const synced = syncTextDraft(state, value);
  if (synced !== state) {
    setState(synced);
  }

  function save(next: string) {
    if (next !== value) commit(next);
  }

  return {
    value: synced.draft,
    onChange(event: ChangeEvent<HTMLTextAreaElement>) {
      const next = event.target.value;
      const nativeEvent = event.nativeEvent as InputEvent;
      const isComposing = synced.isComposing || nativeEvent.isComposing === true;
      setState((current) => ({ ...current, draft: next }));
      if (!isComposing) save(next);
    },
    onCompositionStart() {
      setState((current) => ({ ...current, isComposing: true }));
    },
    onCompositionEnd(event: CompositionEvent<HTMLTextAreaElement>) {
      // Safari 先触发 compositionend 再触发最后一次 input，这里直接读 DOM 值提交
      const next = event.currentTarget.value;
      setState((current) => ({ ...current, draft: next, isComposing: false }));
      save(next);
    },
    onBlur() {
      setState((current) => ({ ...current, isComposing: false }));
      save(synced.draft);
    },
  };
}

export { createTextDraft, syncTextDraft, useTextDraft };
export type { TextDraft };
