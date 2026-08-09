import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { addAuditLog, getStore } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const passwordSchema = z
  .object({
    password: z.string().min(8, "密码至少 8 位").max(128, "密码最多 128 位"),
    confirmPassword: z.string().min(8, "确认密码至少 8 位").max(128, "确认密码最多 128 位"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const params = await context.params;
    const parsed = await parseJson(request, passwordSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    if (isJavaAuthEnabled()) {
      const headers = new Headers(request.headers);
      headers.set("Content-Type", "application/json");
      const javaRequest = new Request(request.url, {
        method: "POST",
        headers,
        body: JSON.stringify(parsed.data),
      });
      return proxyRequestToJavaApi(
        javaRequest,
        `/auth/admin/users/${encodeURIComponent(params.id)}/password`,
      );
    }

    const profile = getStore().profiles.find((item) => item.id === params.id);
    if (!profile) {
      return jsonError("用户不存在", 404);
    }

    const user = getStore().users.find((item) => item.id === profile.userId);
    if (!user) {
      return jsonError("用户不存在", 404);
    }

    user.password = parsed.data.password;
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "reset_user_password",
      targetType: "userProfile",
      targetId: params.id,
      detailJson: {},
    });
    return jsonOk({ ok: true });
  });
}
