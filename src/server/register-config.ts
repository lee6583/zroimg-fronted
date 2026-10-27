import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";
import { serverEnv } from "@/server/env";
import type { JavaResult } from "@/types/api";
import {
  fallbackRegisterConfig,
  normalizeRegisterConfig,
  type RegisterConfig,
} from "@/utils/registration";

// 公开接口，不透传 Cookie；所有页面共用一份缓存，30 秒内后台改动可能尚未生效。
const REVALIDATE_SECONDS = 30;

async function fetchRegisterConfig(): Promise<RegisterConfig> {
  const baseUrl = serverEnv.javaApiBaseUrl.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("JAVA_API_BASE_URL is not configured");
  }

  const response = await fetch(`${baseUrl}/auth/user/register-config`, { cache: "no-store" });
  const payload = (await response.json()) as JavaResult<RegisterConfig>;
  if (!response.ok || payload.code !== 200) {
    throw new Error(`register-config failed: ${response.status}`);
  }

  return normalizeRegisterConfig(payload.data);
}

// 失败时抛出而不是返回兜底值，避免把兜底值写进缓存。
const readCachedRegisterConfig = unstable_cache(fetchRegisterConfig, ["register-config"], {
  revalidate: REVALIDATE_SECONDS,
});

/** 注册开关与赠送积分（登录页、注册页、定价页共用，单次请求内去重）。 */
export const getRegisterConfig = cache(async (): Promise<RegisterConfig> => {
  try {
    return await readCachedRegisterConfig();
  } catch (error) {
    console.error("Failed to load register config", error);
    return fallbackRegisterConfig;
  }
});
