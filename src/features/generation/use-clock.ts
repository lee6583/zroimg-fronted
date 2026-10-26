"use client";

import { useSyncExternalStore } from "react";

const listeners = new Set<() => void>();
let clockNow = 0;
let clockTimer: number | null = null;

// 所有订阅者共用一个 1 秒时钟，最后一个订阅者卸载时停止
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (clockTimer === null) {
    clockNow = Date.now();
    clockTimer = window.setInterval(() => {
      clockNow = Date.now();
      listeners.forEach((item) => item());
    }, 1000);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && clockTimer !== null) {
      window.clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

function getClock() {
  return clockNow;
}

function getServerClock() {
  return 0;
}

// 服务端和水合前返回 0
export function useClock() {
  return useSyncExternalStore(subscribe, getClock, getServerClock);
}
