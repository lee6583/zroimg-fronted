export type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type RequestParams = Record<string, string | number | boolean | undefined | null>;

export type RequestOptions = {
  url: string;
  method?: RequestMethod;
  params?: RequestParams;
  data?: unknown;
  headers?: HeadersInit;
  body?: BodyInit | null;
  credentials?: RequestCredentials;
};

export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  statusCode?: number;
  [key: string]: unknown;
};

export type JavaResult<T> = {
  code: number;
  message: string;
  data?: T;
  [key: string]: unknown;
};

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export type ApiErrorInfo = {
  message: string;
  code: ApiErrorCode | string;
  status: number;
  url: string;
  method: RequestMethod;
  payload: unknown;
};

export type OkResponse = {
  ok: true;
  message?: string;
};
