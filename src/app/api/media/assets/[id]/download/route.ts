import { getCurrentUserProfile } from "@/server/auth";
import { isJavaBffEnabled } from "@/server/env";
import { jsonError } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";

export async function GET(
  request: Request,
  context: RouteContext<"/api/media/assets/[id]/download">,
) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }
  if (!isJavaBffEnabled()) {
    return jsonError("媒体下载接口仅在 Java 模式可用", 404);
  }

  const { id } = await context.params;
  return proxyRequestToJavaApi(request, `/media/user/assets/${encodeURIComponent(id)}/download`);
}
