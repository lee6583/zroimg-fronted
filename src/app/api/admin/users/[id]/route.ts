import { getCurrentUserProfile } from "@/server/auth";
import { deleteMockUser } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";

export async function DELETE(request: Request, context: RouteContext<"/api/admin/users/[id]">) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    if (isJavaAuthEnabled()) {
      return proxyRequestToJavaApi(
        request,
        `/auth/admin/users/${encodeURIComponent(id)}`,
        "DELETE",
      );
    }

    if (!deleteMockUser(id, current.profile.id)) {
      return jsonError("用户不存在", 404);
    }
    return jsonOk({ ok: true });
  });
}
