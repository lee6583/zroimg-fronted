import "server-only";

import { getErrorMessage } from "@/utils/error";
import { headers } from "next/headers";
import { serverEnv } from "@/server/env";
import type { JavaResult, RequestMethod, RequestParams } from "@/types/api";

// Server Component 调 Java 时透传的请求头，让 Java 识别同一个登录态和真实客户端
const FORWARDED_HEADERS = [
  "cookie",
  "user-agent",
  "x-forwarded-for",
  "x-forwarded-proto",
  "x-real-ip",
  "x-request-id",
] as const;

type RequestJavaOptions = {
  method?: RequestMethod;
  params?: RequestParams;
  data?: unknown;
};

export class JavaApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "JavaApiError";
    this.status = status;
  }
}

function buildUrl(path: string, params: RequestParams | undefined) {
  const baseUrl = serverEnv.javaApiBaseUrl.replace(/\/+$/, "");
  if (!baseUrl) {
    throw new Error("JAVA_API_BASE_URL 未配置");
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  if (!query) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}${path}?${query}`;
}

async function buildHeaders(hasBody: boolean) {
  const headerStore = await headers();
  const requestHeaders = new Headers();

  for (const name of FORWARDED_HEADERS) {
    const value = headerStore.get(name);
    if (value) {
      requestHeaders.set(name, value);
    }
  }

  if (hasBody) {
    requestHeaders.set("content-type", "application/json");
  }

  return requestHeaders;
}

/**
 * Server Component 读取 Java 数据。path 是 Java 原始路径（不带 /api），
 * Java 以 `code !== 200` 表示失败，失败时抛出 JavaApiError。
 */
export async function requestJava<T>(path: string, options: RequestJavaOptions = {}) {
  const method = options.method || "GET";
  const hasBody = options.data !== undefined;
  const url = buildUrl(path, options.params);
  // headers() 必须在 try 外调用：Next 靠它抛出的信号把页面标记为动态渲染
  const requestHeaders = await buildHeaders(hasBody);
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: hasBody ? JSON.stringify(options.data) : undefined,
      cache: "no-store",
    });
  } catch (error) {
    console.error("Java API request failed", { method, path, message: getErrorMessage(error) });
    throw new JavaApiError("Java 后端暂时不可用，请稍后重试", 502);
  }

  const payload = (await response.json().catch(() => null)) as JavaResult<T> | null;
  if (!payload || typeof payload.code !== "number") {
    throw new JavaApiError("Java 后端返回格式不正确", 502);
  }

  if (!response.ok || payload.code !== 200) {
    const status = response.ok ? payload.code : response.status;
    throw new JavaApiError(payload.message || "读取 Java 后端数据失败", status);
  }

  return payload.data as T;
}

/** 未登录（401）时返回 null，其余错误照常抛出。 */
export async function requestJavaOrNull<T>(path: string, options: RequestJavaOptions = {}) {
  try {
    return await requestJava<T>(path, options);
  } catch (error) {
    if (error instanceof JavaApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}
