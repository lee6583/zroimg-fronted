import { getErrorMessage } from "@/utils/error";
import type {
  ApiEnvelope,
  ApiErrorCode,
  ApiErrorInfo,
  JavaResult,
  RequestOptions,
} from "@/types/api";

export class ApiRequestError extends Error implements ApiErrorInfo {
  code: ApiErrorCode | string;
  status: number;
  url: string;
  method: ApiErrorInfo["method"];
  payload: unknown;

  constructor(info: ApiErrorInfo) {
    super(info.message);
    this.name = "ApiRequestError";
    this.code = info.code;
    this.status = info.status;
    this.url = info.url;
    this.method = info.method;
    this.payload = info.payload;
  }
}

export function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
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

function readStringField(payload: unknown, field: string) {
  if (!payload || typeof payload !== "object") return "";
  const value = (payload as Record<string, unknown>)[field];
  return typeof value === "string" ? value.trim() : "";
}

function readNumberField(payload: unknown, field: string) {
  if (!payload || typeof payload !== "object") return 0;
  const value = (payload as Record<string, unknown>)[field];
  return typeof value === "number" ? value : 0;
}

function readErrorMessage(payload: unknown, fallback: string) {
  return readStringField(payload, "message") || readStringField(payload, "error") || fallback;
}

function readPayloadCode(payload: unknown) {
  const codeText = readStringField(payload, "code") || readStringField(payload, "errorCode");
  if (codeText) return codeText;

  const codeNumber = readNumberField(payload, "code");
  if (codeNumber) return String(codeNumber);

  return "";
}

function resolveErrorCode(status: number, payload: unknown): ApiErrorCode | string {
  const payloadCode = readPayloadCode(payload);
  if (payloadCode) return payloadCode;

  if (status === 400) return "BAD_REQUEST";
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status >= 500) return "SERVER_ERROR";
  return "UNKNOWN_ERROR";
}

async function parsePayload<T>(response: Response) {
  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await response.json().catch(() => null)) as ApiEnvelope<T> | JavaResult<T> | T | null;
  }

  const text = await response.text().catch(() => "");
  return text ? ({ message: text } as ApiEnvelope<T>) : null;
}

function throwApiError(info: ApiErrorInfo): never {
  throw new ApiRequestError(info);
}

function isApiEnvelope<T>(
  payload: ApiEnvelope<T> | JavaResult<T> | T | null,
): payload is ApiEnvelope<T> {
  return Boolean(
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    typeof payload.success === "boolean",
  );
}

function isJavaResult<T>(
  payload: ApiEnvelope<T> | JavaResult<T> | T | null,
): payload is JavaResult<T> {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const code = (payload as Record<string, unknown>).code;
  const message = (payload as Record<string, unknown>).message;

  return typeof code === "number" && typeof message === "string";
}

function readFailedStatus(response: Response, javaResult: JavaResult<unknown> | null) {
  if (!javaResult) {
    return response.status || 0;
  }

  if (javaResult.code >= 400 && javaResult.code <= 599) {
    return javaResult.code;
  }

  return response.status || javaResult.code;
}

function readJavaData<T>(javaResult: JavaResult<T>) {
  const data = javaResult.data;
  const message = javaResult.message;
  const hasObjectData = data !== undefined && data !== null && typeof data === "object";
  const canMergeMessage = hasObjectData && !Array.isArray(data);

  if (canMergeMessage) {
    return {
      ...data,
      message,
    } as T;
  }

  if (data === undefined || data === null) {
    return { message } as T;
  }

  return data;
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const method = options.method || "GET";
  const headers = new Headers(options.headers);
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
      credentials: options.credentials || "same-origin",
    });
  } catch (error) {
    throwApiError({
      message: getErrorMessage(error),
      code: "NETWORK_ERROR",
      status: 0,
      url,
      method,
      payload: error,
    });
  }

  const payload = await parsePayload<T>(response);
  const envelope = isApiEnvelope(payload) ? payload : null;
  const javaResult = isJavaResult(payload) ? payload : null;
  const failedByEnvelope = envelope?.success === false;
  const failedByJavaCode = Boolean(javaResult && javaResult.code !== 0 && javaResult.code !== 200);

  if (!response.ok || failedByEnvelope || failedByJavaCode) {
    const status = Number(envelope?.statusCode || readFailedStatus(response, javaResult));
    throwApiError({
      message: readErrorMessage(payload, "请求失败"),
      code: resolveErrorCode(status, payload),
      status,
      url,
      method,
      payload,
    });
  }

  if (envelope && "data" in envelope && envelope.data !== undefined) {
    return envelope.data as T;
  }

  if (javaResult) {
    return readJavaData(javaResult);
  }

  if (payload === null) {
    throwApiError({
      message: "服务端返回了空响应",
      code: "SERVER_ERROR",
      status: response.status,
      url,
      method,
      payload,
    });
  }

  return payload as T;
}
