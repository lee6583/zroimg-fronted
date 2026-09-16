import { z } from "zod";

const imagePriceSchema = z.object({
  quality: z.string().trim().min(1, "价格画质不能为空").max(50),
  points: z.number().int().min(0, "价格积分不能小于 0"),
});

const videoPriceSchema = z.object({
  resolution: z.string().trim().min(1, "视频分辨率不能为空").max(32),
  pointsPerSecond: z.number().int().min(0, "每秒积分不能小于 0"),
  referencePoints: z.number().int().min(0, "参考图附加积分不能小于 0"),
});

const commonModelSchema = z.object({
  modelName: z.string().trim().max(100),
  status: z.enum(["enabled", "disabled"]),
  defaultFlag: z.number().int().min(0).max(1),
  sortOrder: z.number().int(),
  ratios: z.array(z.string().trim().min(1)).min(1, "至少选择一个比例"),
});

const dynamicModelSchema = commonModelSchema.extend({
  connectionId: z.string().trim().regex(/^\d+$/, "中转站连接不正确"),
  providerModelCode: z.string().trim().min(1, "请选择供应商模型").max(200),
  capabilityProfile: z.string().trim().min(1, "请选择能力模板").max(64),
});

const legacyModelSchema = commonModelSchema.extend({
  modelCode: z.string().trim().min(1, "模型编码不能为空").max(100),
  adapter: z.enum(["openai", "grok", "generic-video"]),
  apiBaseUrl: z.url("API 地址格式不正确").refine((url) => new URL(url).protocol === "https:", {
    message: "API 地址必须使用 HTTPS",
  }),
  apiKey: z.string().trim().max(2000),
  clearApiKey: z.boolean(),
});

const dynamicImageModelSchema = dynamicModelSchema.extend({
  modelType: z.literal("image"),
  imageToImageEnabled: z.boolean(),
  qualities: z.array(z.string().trim().min(1)).min(1, "至少选择一个画质档位"),
  maxCount: z.number().int().min(1).max(20),
  qualityPrices: z.array(imagePriceSchema).min(1, "至少配置一个画质价格"),
});

const dynamicVideoModelSchema = dynamicModelSchema
  .extend({
    modelType: z.literal("video"),
    imageToVideoEnabled: z.boolean(),
    resolutions: z.array(z.string().trim().min(1).max(32)).min(1, "至少选择一个视频分辨率"),
    minDuration: z.number().int().min(1).max(15),
    maxDuration: z.number().int().min(1).max(15),
    videoPrices: z.array(videoPriceSchema).min(1, "至少配置一个视频分辨率价格"),
  })
  .refine((value) => value.minDuration <= value.maxDuration, {
    message: "最短时长不能大于最长时长",
    path: ["maxDuration"],
  });

const legacyImageModelSchema = legacyModelSchema.extend({
  modelType: z.literal("image"),
  imageToImageEnabled: z.boolean(),
  qualities: z.array(z.string().trim().min(1)).min(1, "至少选择一个画质档位"),
  maxCount: z.number().int().min(1).max(20),
  qualityPrices: z.array(imagePriceSchema).min(1, "至少配置一个画质价格"),
});

const legacyVideoModelSchema = legacyModelSchema
  .extend({
    modelType: z.literal("video"),
    imageToVideoEnabled: z.boolean(),
    resolutions: z.array(z.string().trim().min(1).max(32)).min(1, "至少选择一个视频分辨率"),
    minDuration: z.number().int().min(1).max(15),
    maxDuration: z.number().int().min(1).max(15),
    videoPrices: z.array(videoPriceSchema).min(1, "至少配置一个视频分辨率价格"),
  })
  .refine((value) => value.minDuration <= value.maxDuration, {
    message: "最短时长不能大于最长时长",
    path: ["maxDuration"],
  });

const modelSchema = z.union([
  dynamicImageModelSchema,
  dynamicVideoModelSchema,
  legacyImageModelSchema,
  legacyVideoModelSchema,
]);

export { modelSchema };
