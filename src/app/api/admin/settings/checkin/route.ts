import { getCurrentUserProfile } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/mock-store";
import { updateCheckInSettings } from "@/server/settings";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const { dailyCredits } = (await request.json()) as { dailyCredits?: number };
  const value = Number(dailyCredits || 0);
  if (!Number.isFinite(value) || value < 1) {
    return jsonError("签到积分至少为 1");
  }

  const settings = await updateCheckInSettings({ dailyCredits: value });
  addAuditLog({
    adminProfileId: current.profile.id,
    action: "update_checkin_settings",
    targetType: "systemSetting",
    targetId: "checkin",
    detailJson: { dailyCredits: value },
  });

  return jsonOk({ settings });
}
