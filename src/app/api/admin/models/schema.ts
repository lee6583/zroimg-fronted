import { z } from "zod";

const modeSchema = z.object({
  id: z.string().regex(/^\d+$/).optional(),
  modeCode: z.string().trim().min(1, "模式编码不能为空").max(50),
  modeName: z.string().trim().min(1, "模式名称不能为空").max(50),
  status: z.enum(["enabled", "disabled"]),
  sortOrder: z.number().int(),
});

const paramSchema = z.object({
  id: z.string().regex(/^\d+$/).optional(),
  modeCode: z.string().trim().max(50),
  paramType: z.enum(["ratio", "resolution", "quality", "format", "count", "duration", "audio"]),
  paramValue: z.string().trim().min(1, "参数值不能为空").max(100),
  paramLabel: z.string().trim().min(1, "参数名称不能为空").max(100),
  defaultFlag: z.number().int().min(0).max(1),
  sortOrder: z.number().int(),
});

const priceSchema = z.object({
  id: z.string().regex(/^\d+$/).optional(),
  modeCode: z.string().trim().min(1, "价格模式不能为空").max(50),
  resolution: z.string().trim().min(1, "价格分辨率不能为空").max(50),
  quality: z.string().trim().min(1, "价格画质不能为空").max(50),
  points: z.number().int().min(0, "价格积分不能小于 0"),
  priceVersion: z.string().trim().max(50).optional(),
  status: z.enum(["enabled", "disabled"]),
});

const modelSchema = z.object({
  modelCode: z.string().trim().min(1, "模型编码不能为空").max(100),
  modelName: z.string().trim().min(1, "模型名称不能为空").max(100),
  provider: z.string().trim().min(1, "模型供应商不能为空").max(50),
  apiBaseUrl: z.url("API 地址格式不正确").refine((url) => url.startsWith("https://"), {
    message: "API 地址必须使用 HTTPS",
  }),
  apiKey: z.string().trim().max(2000),
  clearApiKey: z.boolean(),
  modelType: z.enum(["image", "video"]),
  status: z.enum(["enabled", "disabled"]),
  defaultFlag: z.number().int().min(0).max(1),
  sortOrder: z.number().int(),
  remark: z.string().trim().max(500),
  priceVersion: z.string().trim().min(1, "价格版本不能为空").max(50),
  priceChangeReason: z.string().trim().max(255),
  modes: z.array(modeSchema).min(1, "至少配置一个生成模式"),
  params: z.array(paramSchema).min(1, "至少配置一个模型参数"),
  prices: z.array(priceSchema).min(1, "至少配置一条价格规则"),
});

export { modelSchema };
