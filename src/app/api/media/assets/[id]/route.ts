import { getCurrentUserProfile } from "@/server/auth";
import { isJavaBffEnabled } from "@/server/env";
import { jsonError } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";

export async function GET(request: Request, context: RouteContext<"/api/media/assets/[id]">) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  if (!isJavaBffEnabled()) {
    return jsonError("媒体内容接口仅在 Java 模式可用", 404);
  }

  const { id } = await context.params;
  const safeId = encodeURIComponent(id);
  return proxyRequestToJavaApi(request, `/media/user/assets/${safeId}/content`);
}
