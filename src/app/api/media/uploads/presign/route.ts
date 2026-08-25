import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { isJavaBffEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { requestJavaApiData } from "@/server/java-api";
import { parseJson } from "@/server/validation";
import { isSupportedImageType, maxImageBytes } from "@/utils/media";

const presignSchema = z.object({
  originalName: z.string().trim().min(1, "文件名不能为空").max(255, "文件名不能超过 255 个字符"),
  contentType: z.string().trim().refine(isSupportedImageType, "仅支持 PNG、JPEG 和 WebP 图片"),
  size: z.number().int().positive("文件大小必须大于 0").max(maxImageBytes, "图片必须小于 10 MB"),
});

const javaPresignSchema = z.object({
  assetId: z.string().regex(/^\d+$/),
  uploadUrl: z.string().url(),
  requiredHeaders: z.record(z.string(), z.string()),
  expiresAt: z.string(),
  originalName: z.string(),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) return jsonError("请先登录", 401);
    if (!isJavaBffEnabled()) return jsonError("媒体直传接口仅在 Java 模式可用", 404);

    const parsed = await parseJson(request, presignSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const data = await requestJavaApiData<unknown>("/media/user/assets/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
    });
    return jsonOk({ upload: javaPresignSchema.parse(data) });
  });
}
