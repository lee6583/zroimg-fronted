import "server-only";

import { getErrorMessage } from "@/utils/error";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { serverEnv } from "@/server/env";

const JAVA_PROXY_ERROR_HEADER = "x-zroimg-proxy-error";
const FORWARDED_REQUEST_HEADERS = [
  "authorization",
  "content-type",
  "cookie",
  "user-agent",
  "x-forwarded-for",
  "x-real-ip",
  "x-request-id",
] as const;

const FORWARDED_RESPONSE_HEADERS = ["cache-control", "content-type", "location"] as const;

type HeaderSource = {
  get(name: string): string | null;
};

type JavaEnvelope<T> = {
  code?: number;
  success?: boolean;
  data?: T;
  settings?: T;
  error?: string;
  message?: string;
};

type JavaApiDataOptions = {
  method?: "GET" | "POST";
  headers?: HeadersInit;
  body?: BodyInit | null;
};

function normalizeJavaApiBaseUrl() {
  const value = serverEnv.javaApiBaseUrl;
  if (!value) {
    return "";
  }

  return value.replace(/\/+$/, "");
}

function buildJavaApiUrl(path: string) {
  const baseUrl = normalizeJavaApiBaseUrl();
  if (!baseUrl) {
    throw new Error("JAVA_API_BASE_URL 未配置");
  }

  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildForwardHeaders(source: HeaderSource) {
  const nextHeaders = new Headers();

  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = source.get(name);
    if (value) {
      nextHeaders.set(name, value);
    }
  }

  return nextHeaders;
}

function buildProxyResponseHeaders(source: Headers) {
  const nextHeaders = new Headers();

  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = source.get(name);
    if (value) {
      nextHeaders.set(name, value);
    }
  }

  const responseHeaders = source as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof responseHeaders.getSetCookie === "function") {
    for (const cookie of responseHeaders.getSetCookie()) {
      nextHeaders.append("set-cookie", cookie);
    }
  } else {
    const cookie = source.get("set-cookie");
    if (cookie) {
      nextHeaders.set("set-cookie", cookie);
    }
  }

  return nextHeaders;
}

function readJavaErrorMessage(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  if ("message" in payload && typeof payload.message === "string" && payload.message.trim()) {
    return payload.message;
  }

  if ("error" in payload && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }

  return fallback;
}

function isFailedJavaEnvelope(payload: JavaEnvelope<unknown>) {
  if (typeof payload.code !== "number") {
    return false;
  }

  return payload.code !== 0 && payload.code !== 200;
}

export async function proxyRequestToJavaApi(
  request: Request,
  path: string,
  method = request.method,
) {
  try {
    const body =
      method === "GET" || method === "HEAD" ? undefined : (await request.text()) || undefined;

    const response = await fetch(buildJavaApiUrl(path), {
      method,
      headers: buildForwardHeaders(request.headers),
      body,
      cache: "no-store",
    });

    return new Response(response.body, {
      status: response.status,
      headers: buildProxyResponseHeaders(response.headers),
    });
  } catch (error) {
    console.error("Java API proxy failed", {
      method,
      path,
      message: getErrorMessage(error),
    });
    return NextResponse.json(
      {
        success: false,
        message: "Java 后端暂时不可用，请稍后重试",
        code: "JAVA_UNAVAILABLE",
      },
      {
        status: 502,
        headers: {
          [JAVA_PROXY_ERROR_HEADER]: "java_unavailable",
        },
      },
    );
  }
}

export async function requestJavaApiData<T>(path: string, options: JavaApiDataOptions = {}) {
  try {
    const method = options.method || "GET";
    const headerStore = await headers();
    const nextHeaders = buildForwardHeaders(headerStore);

    if (options.headers) {
      const customHeaders = new Headers(options.headers);
      customHeaders.forEach((value, key) => {
        nextHeaders.set(key, value);
      });
    }

    const response = await fetch(buildJavaApiUrl(path), {
      method,
      headers: nextHeaders,
      body: options.body,
      cache: "no-store",
    });
    const payload = (await response.json()) as JavaEnvelope<T>;
    const failedByJavaCode = isFailedJavaEnvelope(payload);

    if (!response.ok || failedByJavaCode) {
      throw new Error(readJavaErrorMessage(payload, "读取 Java 后端数据失败"));
    }

    if (payload.data !== undefined) {
      return payload.data;
    }

    if (payload.settings !== undefined) {
      return payload.settings;
    }

    return payload as T;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function getJavaApiData<T>(path: string) {
  return requestJavaApiData<T>(path);
}
