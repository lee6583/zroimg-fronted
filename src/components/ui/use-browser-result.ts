"use client";

import { useEffect, useState } from "react";
import { readBrowserResult, saveBrowserResult } from "@/utils/browser-results";

export function useBrowserResultUrl(id: string | null, url: string, enabled: boolean) {
  const [storedUrl, setStoredUrl] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    const resultId = id;
    if (!enabled || !resultId || !url) return;
    const validId = resultId;

    let cancelled = false;
    let objectUrl: string | null = null;

    async function load() {
      try {
        let stored = await readBrowserResult(validId);
        if (!stored) {
          await saveBrowserResult({ id: validId, url, fileName: `zroimg-${validId}` });
          stored = await readBrowserResult(validId);
        }
        if (!cancelled && stored) {
          objectUrl = URL.createObjectURL(stored.blob);
          setStoredUrl({ id: validId, url: objectUrl });
        }
      } catch {
        // Keep the short-lived server URL as a fallback when browser storage is unavailable.
      }
    }

    void load();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enabled, id, url]);

  return enabled && id && storedUrl?.id === id ? storedUrl.url : url;
}
