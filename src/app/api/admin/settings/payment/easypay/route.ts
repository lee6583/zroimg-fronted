import { getCurrentUserProfile } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/mock-store";
import { updateEasyPaySettings } from "@/server/settings";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const payload = (await request.json()) as {
    enabled?: boolean;
    apiBase?: string;
    pid?: string;
    key?: string;
    clearKey?: boolean;
    notifyUrl?: string;
    returnUrl?: string;
  };

  const settings = await updateEasyPaySettings({
    enabled: Boolean(payload.enabled),
    apiBase: payload.apiBase,
    pid: payload.pid,
    key: payload.key,
    clearKey: payload.clearKey,
    notifyUrl: payload.notifyUrl,
    returnUrl: payload.returnUrl,
  });

  addAuditLog({
    adminProfileId: current.profile.id,
    action: "update_easypay_settings",
    targetType: "systemSetting",
    targetId: "easypay",
    detailJson: { enabled: settings.enabled, apiBase: settings.apiBase },
  });

  return jsonOk({ settings });
}
