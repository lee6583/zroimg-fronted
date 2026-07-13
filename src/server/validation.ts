import "server-only";

import { z } from "zod";

export const optionalHttpUrlSchema = z
  .string()
  .trim()
  .max(2048, "URL 过长")
  .refine((value) => !value || isHttpUrl(value), "URL 格式不正确");

export const httpUrlSchema = optionalHttpUrlSchema.refine((value) => Boolean(value), "请输入 URL");

type ParseResult<T> = { ok: true; data: T } | { ok: false; message: string };

export async function parseJson<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<ParseResult<z.output<Schema>>> {
  const payload = await request.json().catch(() => undefined);
  if (payload === undefined) {
    return { ok: false, message: "请求内容必须是有效 JSON" };
  }

  const result = schema.safeParse(payload);
  if (!result.success) {
    return {
      ok: false,
      message: result.error.issues[0]?.message || "请求参数不合法",
    };
  }

  return { ok: true, data: result.data };
}

export async function parseForm<Schema extends z.ZodType>(
  request: Request,
  schema: Schema,
): Promise<ParseResult<z.output<Schema>>> {
  const form = await request.formData().catch(() => null);
  if (!form) {
    return { ok: false, message: "请求内容必须是有效表单" };
  }

  const result = schema.safeParse(Object.fromEntries(form));
  if (!result.success) {
    return {
      ok: false,
      message: result.error.issues[0]?.message || "请求参数不合法",
    };
  }

  return { ok: true, data: result.data };
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
