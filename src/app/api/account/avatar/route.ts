import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { createMediaAsset, getStore } from "@/server/bff/mock-store";
import { isJavaBffEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import { parseForm } from "@/server/validation";
import { isSupportedImageType, maxImageBytes } from "@/utils/media";

const avatarSchema = z.object({
  file: z
    .instanceof(File, { error: "请选择头像图片" })
    .refine((file) => isSupportedImageType(file.type), "仅支持 PNG、JPEG 和 WebP 图片")
    .refine((file) => file.size > 0 && file.size <= maxImageBytes, "头像图片必须小于 10 MB"),
});

const javaAvatarSchema = z.object({
  id: javaIdSchema,
});

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const parsed = await parseForm(request, avatarSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    if (isJavaBffEnabled()) {
      const body = new FormData();
      body.set("file", parsed.data.file);
      const data = await requestJavaApiData<unknown>("/media/user/assets/avatar", {
        method: "POST",
        body,
      });
      const avatar = javaAvatarSchema.parse(data);
      return jsonOk({ avatarUrl: `/api/media/avatars/${avatar.id}` });
    }

    const file = parsed.data.file;
    const bytes = Buffer.from(await file.arrayBuffer());
    const asset = createMediaAsset({
      ownerUserProfileId: current.profile.id,
      fileName: file.name,
      kind: "avatar",
    });
    asset.url = `data:${file.type};base64,${bytes.toString("base64")}`;
    const profile = getStore().profiles.find((item) => item.id === current.profile.id);
    if (profile) {
      profile.avatarUrl = asset.url;
    }
    return jsonOk({ avatarUrl: asset.url });
  });
}
