type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestParams = Record<string, string | number | boolean | undefined | null>;

type RequestOptions = {
  url: string;
  method?: RequestMethod;
  params?: RequestParams;
  data?: unknown;
  headers?: HeadersInit;
  body?: BodyInit | null;
  credentials?: RequestCredentials;
};

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  statusCode?: number;
  [key: string]: unknown;
};

type JavaResult<T> = {
  code: number;
  message: string;
  data?: T;
  [key: string]: unknown;
};

type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

type ApiErrorInfo = {
  message: string;
  code: ApiErrorCode | string;
  status: number;
  url: string;
  method: RequestMethod;
  payload: unknown;
};

type OkResponse = {
  ok: true;
  message?: string;
};

export type {
  RequestMethod,
  RequestParams,
  RequestOptions,
  ApiEnvelope,
  JavaResult,
  ApiErrorCode,
  ApiErrorInfo,
  OkResponse,
};
