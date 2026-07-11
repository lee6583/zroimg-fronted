import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/bff/mock-store";
import { updateCheckInSettings } from "@/server/bff/account";
import { parseJson } from "@/server/validation";

const checkInSchema = z.object({
  dailyCredits: z.number().int().min(1, "签到积分至少为 1").max(10_000),
});

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const parsed = await parseJson(request, checkInSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const { dailyCredits } = parsed.data;

  const settings = await updateCheckInSettings({ dailyCredits });
  addAuditLog({
    adminProfileId: current.profile.id,
    action: "update_checkin_settings",
    targetType: "systemSetting",
    targetId: "checkin",
    detailJson: { dailyCredits },
  });

  return jsonOk({ settings });
}
