"use client";

import { useSyncExternalStore } from "react";

// 生成工作区在 < 1024px 时隐藏左侧对话栏和设置停靠栏，改用 Sheet 弹出。
const compactQuery = "(max-width: 1023px)";

function subscribe(callback: () => void) {
  const query = window.matchMedia(compactQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

function getCompact() {
  return window.matchMedia(compactQuery).matches;
}

function getServerCompact() {
  return false;
}

/** 服务端与首次渲染返回 false。 */
export function useCompactLayout() {
  return useSyncExternalStore(subscribe, getCompact, getServerCompact);
}
