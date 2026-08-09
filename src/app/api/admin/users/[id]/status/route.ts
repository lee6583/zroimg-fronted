import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { addAuditLog, getStore } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const statusSchema = z.object({
  status: z.enum(["active", "banned"]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, statusSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const { status } = parsed.data;
    if (isJavaAuthEnabled()) {
      const headers = new Headers(request.headers);
      headers.set("Content-Type", "application/json");
      const javaRequest = new Request(request.url, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status }),
      });
      return proxyRequestToJavaApi(
        javaRequest,
        `/auth/admin/users/${encodeURIComponent(id)}/status`,
      );
    }

    const profile = getStore().profiles.find((item) => item.id === id);
    if (!profile) {
      return jsonError("用户不存在", 404);
    }

    profile.status = status;
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "update_user_status",
      targetType: "userProfile",
      targetId: id,
      detailJson: { status },
    });

    return jsonOk({ status });
  });
}
