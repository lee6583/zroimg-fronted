import { getCurrentUserProfile } from "@/server/auth";
import { claimDailyCheckIn, getCheckInStatus } from "@/server/bff/account";
import { claimJavaCheckIn, getJavaCheckInStatus } from "@/server/bff/internal/java-checkins";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";

export async function GET() {
  return handleApi(async () => {
    if (isJavaAuthEnabled()) {
      const checkIn = await getJavaCheckInStatus();
      return jsonOk({ checkIn });
    }

    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const checkIn = await getCheckInStatus(current.profile.id);
    return jsonOk({ checkIn });
  });
}

export async function POST() {
  return handleApi(async () => {
    if (isJavaAuthEnabled()) {
      const result = await claimJavaCheckIn();
      return jsonOk(result);
    }

    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const checkIn = await claimDailyCheckIn(current.profile.id);
    return jsonOk({ checkIn, addedCredits: checkIn.dailyCredits });
  });
}
