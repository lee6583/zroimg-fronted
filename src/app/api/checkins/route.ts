import { getCurrentUserProfile } from "@/server/auth";
import { claimDailyCheckIn } from "@/server/bff/account";
import { handleApi, jsonError, jsonOk } from "@/server/http";

export async function POST() {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const checkIn = await claimDailyCheckIn(current.profile.id);
    return jsonOk({ checkIn });
  });
}
