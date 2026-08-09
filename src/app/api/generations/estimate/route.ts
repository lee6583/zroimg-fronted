import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { estimatePrice } from "@/server/bff/generation";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const estimateSchema = z.object({
  model: z.string().trim().min(1, "请选择模型").max(100),
  mode: z.enum(["text", "edit"]),
  ratio: z.string().trim().min(1, "请选择图片比例").max(20),
  resolution: z.string().trim().min(1, "请选择分辨率").max(20),
  quality: z.string().trim().min(1, "请选择画质").max(50),
  outputFormat: z.string().trim().min(1, "请选择图片格式").max(50),
  imageCount: z.number().int().min(1).max(20),
  size: z.string().trim().min(1, "图片尺寸不能为空").max(50),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const parsed = await parseJson(request, estimateSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const price = await estimatePrice(current.profile.id, parsed.data);
    return jsonOk(price);
  });
}
