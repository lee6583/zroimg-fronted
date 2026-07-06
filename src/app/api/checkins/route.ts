import { getCurrentUserProfile } from "@/server/auth";
import { claimDailyCheckIn } from "@/server/checkins";
import { jsonError, jsonOk } from "@/server/http";

export async function POST() {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  try {
    const checkIn = await claimDailyCheckIn(current.profile.id);
    return jsonOk({ checkIn });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "签到失败");
  }
}
