type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestOptions = {
  url: string;
  method?: RequestMethod;
  params?: Record<string, string | number | boolean | undefined | null>;
  data?: unknown;
  headers?: HeadersInit;
  body?: BodyInit | null;
  credentials?: RequestCredentials;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  [key: string]: unknown;
};

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

function readErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") return fallback;

  if ("message" in payload && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  return fallback;
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const method = options.method || "GET";
  const headers = new Headers(options.headers);
  let body = options.body;

  if (body === undefined && options.data !== undefined) {
    if (isBodyInit(options.data)) {
      body = options.data;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.data);
    }
  }

  const response = await fetch(buildUrl(options.url, options.params), {
    method,
    headers,
    body,
    credentials: options.credentials || "same-origin",
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, "请求失败"));
  }

  if (payload && typeof payload === "object" && "data" in payload && payload.data !== undefined) {
    return payload.data as T;
  }

  return (payload as T) ?? ({} as T);
}
