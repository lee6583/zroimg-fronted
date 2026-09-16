import { z } from "zod";

const connectionSchema = z.object({
  name: z.string().trim().min(1, "请输入连接名称").max(100),
  adapter: z.enum(["openai", "grok"]),
  apiBaseUrl: z
    .url("中转站地址格式不正确")
    .refine((value) => value.startsWith("https://"), "中转站地址必须使用 HTTPS"),
  apiKey: z.string().trim().max(2000),
  clearApiKey: z.boolean(),
  status: z.enum(["enabled", "disabled"]),
});

const discoverSchema = z.object({
  adapter: z.enum(["openai", "grok"]),
  apiBaseUrl: z
    .url("中转站地址格式不正确")
    .refine((value) => value.startsWith("https://"), "中转站地址必须使用 HTTPS"),
  apiKey: z.string().trim().min(1, "请输入 API Key").max(2000),
});

export { connectionSchema, discoverSchema };
