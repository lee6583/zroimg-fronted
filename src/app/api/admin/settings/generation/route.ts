import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/bff/mock-store";
import { updateGenerationConfig } from "@/server/bff/account";
import { optionalHttpUrlSchema, parseJson } from "@/server/validation";

const settingsSchema = z.object({
  enabled: z.boolean(),
  baseUrl: optionalHttpUrlSchema,
  model: z.string().trim().min(1, "请输入模型名").max(100),
  apiKey: z.string().trim().max(4096),
  clearApiKey: z.boolean(),
});

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const parsed = await parseJson(request, settingsSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const payload = parsed.data;

  const settings = await updateGenerationConfig({
    enabled: payload.enabled,
    baseUrl: payload.baseUrl,
    model: payload.model,
    apiKey: payload.apiKey,
    clearApiKey: payload.clearApiKey,
  });

  addAuditLog({
    adminProfileId: current.profile.id,
    action: "update_generation_settings",
    targetType: "systemSetting",
    targetId: "generation",
    detailJson: { model: payload.model, enabled: payload.enabled },
  });

  return jsonOk({ settings });
}
