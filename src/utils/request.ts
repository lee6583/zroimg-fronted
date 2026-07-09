import { getErrorMessage } from "@/utils/error";
import type {
  ApiEnvelope,
  ApiErrorCode,
  ApiErrorInfo,
  ApiErrorInterceptor,
  RequestInterceptor,
  RequestOptions,
} from "@/types/api";

const requestInterceptors: RequestInterceptor[] = [];
const errorInterceptors: ApiErrorInterceptor[] = [];

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

export function addRequestInterceptor(interceptor: RequestInterceptor) {
  requestInterceptors.push(interceptor);
  return () => removeInterceptor(requestInterceptors, interceptor);
}

export function addApiErrorInterceptor(interceptor: ApiErrorInterceptor) {
  errorInterceptors.push(interceptor);
  return () => removeInterceptor(errorInterceptors, interceptor);
}

function removeInterceptor<T>(interceptors: T[], interceptor: T) {
  const index = interceptors.indexOf(interceptor);
  if (index >= 0) {
    interceptors.splice(index, 1);
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

function readStringField(payload: unknown, field: string) {
  if (!payload || typeof payload !== "object") return "";
  const value = (payload as Record<string, unknown>)[field];
  return typeof value === "string" ? value.trim() : "";
}

function readErrorMessage(payload: unknown, fallback: string) {
  return (
    readStringField(payload, "message") ||
    readStringField(payload, "error") ||
    fallback
  );
}

function readPayloadCode(payload: unknown) {
  return (
    readStringField(payload, "code") ||
    readStringField(payload, "errorCode") ||
    ""
  );
}

function resolveErrorCode(
  status: number,
  payload: unknown,
): ApiErrorCode | string {
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
    return (await response.json().catch(() => null)) as
      ApiEnvelope<T> | T | null;
  }

  const text = await response.text().catch(() => "");
  return text ? ({ message: text } as ApiEnvelope<T>) : null;
}

async function applyRequestInterceptors(options: RequestOptions) {
  let nextOptions = options;
  for (const interceptor of requestInterceptors) {
    nextOptions = await interceptor(nextOptions);
  }
  return nextOptions;
}

async function notifyErrorInterceptors(error: ApiRequestError) {
  for (const interceptor of errorInterceptors) {
    await interceptor(error);
  }
}

async function throwApiError(info: ApiErrorInfo): Promise<never> {
  const error = new ApiRequestError(info);
  await notifyErrorInterceptors(error);
  throw error;
}

function isApiEnvelope<T>(
  payload: ApiEnvelope<T> | T | null,
): payload is ApiEnvelope<T> {
  return Boolean(payload && typeof payload === "object");
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const interceptedOptions = await applyRequestInterceptors(options);
  const method = interceptedOptions.method || "GET";
  const headers = new Headers(interceptedOptions.headers);
  let body = interceptedOptions.body;

  if (body === undefined && interceptedOptions.data !== undefined) {
    if (isBodyInit(interceptedOptions.data)) {
      body = interceptedOptions.data;
    } else {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      body = JSON.stringify(interceptedOptions.data);
    }
  }

  const url = buildUrl(interceptedOptions.url, interceptedOptions.params);
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      credentials: interceptedOptions.credentials || "same-origin",
    });
  } catch (error) {
    return throwApiError({
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
  const failedByEnvelope = envelope?.success === false;

  if (!response.ok || failedByEnvelope) {
    const status = Number(envelope?.statusCode || response.status || 0);
    await throwApiError({
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

  return (payload as T) ?? ({} as T);
}
