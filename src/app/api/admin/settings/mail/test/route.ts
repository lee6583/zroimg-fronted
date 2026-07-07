import { getCurrentUserProfile } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { hasJavaApiBaseUrl, proxyRequestToJavaApi } from "@/server/java-api";

export async function POST(request: Request) {
  if (hasJavaApiBaseUrl()) {
    return proxyRequestToJavaApi(request, "/v1/admin/settings/smtp/test");
  }

  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const payload = (await request.json()) as { mode?: "connection" | "email"; email?: string };
  if (payload.mode === "email" && !payload.email?.trim()) {
    return jsonError("请输入测试邮箱");
  }

  // TODO(java-backend): trigger real SMTP connectivity and test email through backend service.
  return jsonOk({ ok: true });
}
