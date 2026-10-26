type RequestMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type RequestParams = Record<string, string | number | boolean | undefined | null>;

type RequestOptions = {
  url: string;
  method?: RequestMethod;
  params?: RequestParams;
  data?: unknown;
  headers?: HeadersInit;
  body?: BodyInit | null;
};

type JavaResult<T> = {
  code: number;
  message: string;
  // 计划中的稳定业务错误码（例如 "AUTH_INVALID_CREDENTIALS"），前端据此映射 errors.api.* 文案，见 docs/i18n.md。
  errorCode?: string;
  data?: T;
};

type ApiErrorInfo = {
  message: string;
  code: number;
  errorCode?: string;
  status: number;
  url: string;
  method: RequestMethod;
};

type PageResult<T> = {
  total: number;
  pages: number;
  list: T[];
};

export type { RequestMethod, RequestParams, RequestOptions, JavaResult, ApiErrorInfo, PageResult };
