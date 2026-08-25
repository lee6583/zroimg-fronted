import { getCurrentUserProfile } from "@/server/auth";
import { isJavaBffEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) return jsonError("请先登录", 401);
    if (!isJavaBffEnabled()) return jsonError("媒体直传接口仅在 Java 模式可用", 404);

    const { id } = await context.params;
    const assetId = javaIdSchema.parse(id);
    await requestJavaApiData<unknown>(`/media/user/assets/uploads/${encodeURIComponent(assetId)}`, {
      method: "DELETE",
    });
    return jsonOk({ ok: true });
  });
}
