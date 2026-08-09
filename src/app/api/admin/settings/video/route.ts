import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { addAuditLog } from "@/server/bff/mock-store";
import { getVideoConfig, updateVideoConfig } from "@/server/bff/account";
import { isJavaBffEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const videoSchema = z.object({
  enabled: z.boolean(),
  baseUrl: z.string().trim().max(500),
  model: z.string().trim().min(1, "请输入视频模型").max(100),
  publicBaseUrl: z.string().trim().max(500),
  apiKey: z.string().max(4096),
  clearApiKey: z.boolean(),
});

export async function GET(request: Request) {
  if (isJavaBffEnabled()) {
    return proxyRequestToJavaApi(request, "/admin/settings/video", "GET");
  }

  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }
    const settings = await getVideoConfig();
    return jsonOk({ settings });
  });
}

export async function POST(request: Request) {
  if (isJavaBffEnabled()) {
    return proxyRequestToJavaApi(request, "/admin/settings/video", "POST");
  }

  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const parsed = await parseJson(request, videoSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const settings = await updateVideoConfig(parsed.data);
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "update_video_settings",
      targetType: "systemSetting",
      targetId: "video",
      detailJson: { enabled: settings.enabled, model: settings.model },
    });

    return jsonOk({ settings });
  });
}
