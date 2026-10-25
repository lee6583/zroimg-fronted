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
  data?: T;
};

type ApiErrorInfo = {
  message: string;
  code: number;
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
