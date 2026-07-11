import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/bff/mock-store";
import { updateEasyPaySettings } from "@/server/bff/account";
import { httpUrlSchema, optionalHttpUrlSchema, parseJson } from "@/server/validation";

const settingsSchema = z.object({
  enabled: z.boolean(),
  apiBase: optionalHttpUrlSchema,
  pid: z.string().trim().max(128),
  key: z.string().trim().max(4096),
  clearKey: z.boolean(),
  notifyUrl: httpUrlSchema,
  returnUrl: httpUrlSchema,
});

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const parsed = await parseJson(request, settingsSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const payload = parsed.data;

  const settings = await updateEasyPaySettings({
    enabled: payload.enabled,
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
