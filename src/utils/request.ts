import { getErrorMessage } from "@/utils/error";
import type { ApiErrorInfo, JavaResult, RequestOptions } from "@/types/api";

export class ApiRequestError extends Error implements ApiErrorInfo {
  code: number;
  errorCode?: string;
  status: number;
  url: string;
  method: ApiErrorInfo["method"];

  constructor(info: ApiErrorInfo) {
    super(info.message);
    this.name = "ApiRequestError";
    this.code = info.code;
    this.errorCode = info.errorCode;
    this.status = info.status;
    this.url = info.url;
    this.method = info.method;
  }
}

function buildUrl(url: string, params?: RequestOptions["params"]) {
  if (!params) return url;

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  if (!query) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${query}`;
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value) ||
    typeof value === "string"
  );
}

function isJavaResult(payload: unknown): payload is JavaResult<unknown> {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const code = (payload as Record<string, unknown>).code;
  const message = (payload as Record<string, unknown>).message;

  return typeof code === "number" && typeof message === "string";
}

// Java 按 Accept-Language 返回对应语言的 message；语言取自根布局写入的 <html lang>。
function readPageLocale() {
  if (typeof document === "undefined") {
    return "";
  }

  return document.documentElement.lang;
}

async function parsePayload(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json().catch(() => null);
}

/**
 * 浏览器请求 Java 后端。url 使用 Java 路径并带上 /api 前缀，例如 /api/auth/user/me。
 * Java 以 `code !== 200` 表示失败，即使 HTTP 状态码是 200 也按失败处理。
 */
export async function request<T>(options: RequestOptions): Promise<T> {
  const method = options.method || "GET";
  const headers = new Headers(options.headers);
  const pageLocale = readPageLocale();
  if (pageLocale && !headers.has("Accept-Language")) {
    headers.set("Accept-Language", pageLocale);
  }
  let body = options.body;

  if (body === undefined && options.data !== undefined) {
    if (isBodyInit(options.data)) {
      body = options.data;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body = JSON.stringify(options.data);
    }
  }

  const url = buildUrl(options.url, options.params);
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      credentials: "same-origin",
    });
  } catch (error) {
    throw new ApiRequestError({
      message: getErrorMessage(error),
      code: 0,
      status: 0,
      url,
      method,
    });
  }

  const payload = await parsePayload(response);
  const result = isJavaResult(payload) ? payload : null;

  if (!result) {
    throw new ApiRequestError({
      message: response.ok ? "服务端返回格式不正确" : "服务暂时不可用，请稍后重试",
      code: response.status,
      status: response.status,
      url,
      method,
    });
  }

  if (!response.ok || result.code !== 200) {
    throw new ApiRequestError({
      message: result.message || "请求失败",
      code: result.code,
      errorCode: typeof result.errorCode === "string" ? result.errorCode : undefined,
      status: response.ok ? result.code : response.status,
      url,
      method,
    });
  }

  return result.data as T;
}
