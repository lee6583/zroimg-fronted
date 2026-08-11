import { z } from "zod";

const priceSchema = z.object({
  quality: z.string().trim().min(1, "价格画质不能为空").max(50),
  points: z.number().int().min(0, "价格积分不能小于 0"),
});

const modelSchema = z.object({
  modelCode: z.string().trim().min(1, "请选择模型").max(100),
  adapter: z.enum(["openai", "grok"]),
  apiBaseUrl: z.url("API 地址格式不正确").refine((url) => url.startsWith("https://"), {
    message: "API 地址必须使用 HTTPS",
  }),
  apiKey: z.string().trim().max(2000),
  clearApiKey: z.boolean(),
  status: z.enum(["enabled", "disabled"]),
  defaultFlag: z.number().int().min(0).max(1),
  sortOrder: z.number().int(),
  imageToImageEnabled: z.boolean(),
  ratios: z.array(z.string().trim().min(1)).min(1, "至少选择一个图片比例"),
  qualities: z.array(z.string().trim().min(1)).min(1, "至少选择一个画质档位"),
  maxCount: z.number().int().min(1).max(20),
  qualityPrices: z.array(priceSchema).min(1, "至少配置一个画质价格"),
});

export { modelSchema };
