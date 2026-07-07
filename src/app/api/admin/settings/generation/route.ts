import { getCurrentUserProfile } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/bff/mock-store";
import { updateGenerationProviderConfig } from "@/server/bff/account";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const payload = (await request.json()) as {
    enabled?: boolean;
    baseUrl?: string;
    model?: string;
    apiKey?: string;
    clearApiKey?: boolean;
  };

  if (!payload.model?.trim()) {
    return jsonError("请输入模型名");
  }

  const settings = await updateGenerationProviderConfig({
    enabled: Boolean(payload.enabled),
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
    detailJson: { model: payload.model, enabled: Boolean(payload.enabled) },
  });

  return jsonOk({ settings });
}
