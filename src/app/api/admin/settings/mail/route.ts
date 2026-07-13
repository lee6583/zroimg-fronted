import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/bff/mock-store";
import { getSmtpAdminConfig, updateSmtpSettings } from "@/server/bff/account";
import { isMockBffEnabled } from "@/server/env";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const smtpSchema = z.object({
  enabled: z.boolean(),
  host: z.string().trim().max(255),
  port: z.number().int().min(1).max(65_535),
  secure: z.boolean(),
  user: z.string().trim().max(320),
  password: z.string().max(4096),
  clearPassword: z.boolean(),
  from: z.string().trim().min(1, "请输入发件人").max(320),
});

export async function GET(request: Request) {
  if (!isMockBffEnabled()) {
    return proxyRequestToJavaApi(request, "/admin/settings/smtp", "GET");
  }

  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const settings = await getSmtpAdminConfig();
  return jsonOk({ settings });
}

export async function POST(request: Request) {
  if (!isMockBffEnabled()) {
    return proxyRequestToJavaApi(request, "/admin/settings/smtp", "PUT");
  }

  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const parsed = await parseJson(request, smtpSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const payload = parsed.data;

  const settings = await updateSmtpSettings({
    enabled: payload.enabled,
    host: payload.host,
    port: payload.port,
    secure: payload.secure,
    user: payload.user,
    password: payload.password,
    clearPassword: payload.clearPassword,
    from: payload.from,
  });

  addAuditLog({
    adminProfileId: current.profile.id,
    action: "update_smtp_settings",
    targetType: "systemSetting",
    targetId: "smtp",
    detailJson: { enabled: settings.enabled, host: settings.host },
  });

  return jsonOk({ settings });
}
