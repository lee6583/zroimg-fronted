import { getCurrentUserProfile } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/mock-store";
import { updateSmtpSettings } from "@/server/settings";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const payload = (await request.json()) as {
    enabled?: boolean;
    host?: string;
    port?: number;
    secure?: boolean;
    user?: string;
    password?: string;
    clearPassword?: boolean;
    from?: string;
  };

  const settings = await updateSmtpSettings({
    enabled: Boolean(payload.enabled),
    host: payload.host,
    port: Number(payload.port || 587),
    secure: Boolean(payload.secure),
    user: payload.user,
    password: payload.password,
    clearPassword: payload.clearPassword,
    from: payload.from?.trim() || "ZroCodeImg <noreply@zrocodeimg.dev>",
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
