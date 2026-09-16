import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { uploadMedia } from "@/server/bff/generation";
import { isJavaBffEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import { parseForm } from "@/server/validation";
import { isSupportedImageType, maxImageBytes } from "@/utils/media";

const uploadSchema = z.object({
  file: z
    .instanceof(File, { error: "请选择文件" })
    .refine((file) => isSupportedImageType(file.type), "仅支持 PNG、JPEG 和 WebP 图片")
    .refine((file) => file.size > 0 && file.size <= maxImageBytes, "单张图片必须小于 10 MB"),
});

const javaMediaSchema = z.object({
  id: javaIdSchema,
  originalName: z.string(),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const parsed = await parseForm(request, uploadSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    if (isJavaBffEnabled()) {
      const body = new FormData();
      body.set("file", parsed.data.file);
      const data = await requestJavaApiData<unknown>("/media/user/assets", {
        method: "POST",
        body,
      });
      const media = javaMediaSchema.parse(data);

      return jsonOk({
        media: {
          id: media.id,
          fileName: media.originalName,
          kind: "input" as const,
        },
      });
    }

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
  });
}
