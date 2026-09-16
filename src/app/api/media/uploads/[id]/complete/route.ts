import { getCurrentUserProfile } from "@/server/auth";
import { isJavaBffEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import { z } from "zod";

const javaMediaSchema = z.object({
  id: javaIdSchema,
  originalName: z.string(),
});

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) return jsonError("请先登录", 401);
    if (!isJavaBffEnabled()) return jsonError("媒体直传接口仅在 Java 模式可用", 404);

    const { id } = await context.params;
    const assetId = javaIdSchema.parse(id);
    const data = await requestJavaApiData<unknown>(
      `/media/user/assets/uploads/${encodeURIComponent(assetId)}/complete`,
      { method: "POST" },
    );
    const media = javaMediaSchema.parse(data);
    return jsonOk({
      media: { id: media.id, fileName: media.originalName, kind: "input" as const },
    });
  });
}
