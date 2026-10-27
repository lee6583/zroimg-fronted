"use client";

import { useEffect, useRef, useState } from "react";

/** 复制到剪贴板，复制成功后 2 秒内 isCopied 为 true。 */
export function useCopy() {
  const [isCopied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return { isCopied, copy };
}
