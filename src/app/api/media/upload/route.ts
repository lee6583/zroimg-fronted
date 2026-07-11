import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { uploadMedia } from "@/server/bff/generation";
import { jsonError, jsonOk } from "@/server/http";
import { parseForm } from "@/server/validation";
import { isSupportedImageType, maxImageBytes } from "@/utils/media";

const uploadSchema = z.object({
  file: z
    .instanceof(File, { error: "请选择文件" })
    .refine((file) => isSupportedImageType(file.type), "仅支持 PNG、JPEG 和 WebP 图片")
    .refine((file) => file.size > 0 && file.size <= maxImageBytes, "单张图片必须小于 10 MB"),
});

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const parsed = await parseForm(request, uploadSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const media = await uploadMedia({
    ownerUserProfileId: current.profile.id,
    fileName: parsed.data.file.name,
    kind: "input",
  });

  return jsonOk({
    media: {
      id: media.id,
      fileName: media.fileName,
      kind: media.kind,
    },
  });
}
