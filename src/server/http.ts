import "server-only";

import { NextResponse } from "next/server";
import type { ApiErrorCode } from "@/types/api";

type ApiHandler = () => Promise<Response>;

export class AppError extends Error {
  status: number;
  code?: ApiErrorCode;

  constructor(message: string, status = 400, code?: ApiErrorCode) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ success: true, data }, init);
}

export function jsonError(message: string, status = 400, code: ApiErrorCode = errorCode(status)) {
  return NextResponse.json({ success: false, message, code }, { status });
}

export async function handleApi(fn: ApiHandler) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AppError) {
      return jsonError(error.message, error.status, error.code ?? errorCode(error.status));
    }

    if (error instanceof Error) {
      return jsonError(error.message);
    }

    console.error("Unhandled API error", error);
    return jsonError("服务器内部错误", 500);
  }
}

function errorCode(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422) return "VALIDATION_ERROR";
  if (status >= 500) return "SERVER_ERROR";
  return "BAD_REQUEST";
}
