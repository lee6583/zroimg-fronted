import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { isMockBffEnabled } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const testSchema = z
  .object({
    mode: z.enum(["connection", "email"]),
    email: z.string().trim().email("测试邮箱格式不正确").optional(),
  })
  .refine((value) => value.mode !== "email" || Boolean(value.email), {
    message: "请输入测试邮箱",
    path: ["email"],
  });

export async function POST(request: Request) {
  if (!isMockBffEnabled()) {
    return proxyRequestToJavaApi(request, "/admin/settings/smtp/test");
  }

  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const parsed = await parseJson(request, testSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  // TODO(java-backend): trigger real SMTP connectivity and test email through backend service.
  return jsonOk({ ok: true });
}
