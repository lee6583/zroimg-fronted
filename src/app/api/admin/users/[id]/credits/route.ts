import { getErrorMessage } from "@/utils/error";
import { getCurrentUserProfile } from "@/server/auth";
import { addAuditLog, adjustProfileCredits } from "@/server/bff/mock-store";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const { id } = await context.params;
  const { amount, reason } = (await request.json()) as { amount?: number; reason?: string };
  const normalizedAmount = Number(amount || 0);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount === 0) {
    return jsonError("请输入非 0 的积分变动值");
  }

  try {
    const profile = adjustProfileCredits(id, normalizedAmount, reason?.trim() || "Manual adjustment", "adjustment");
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "adjust_credits",
      targetType: "userProfile",
      targetId: id,
      detailJson: { amount: normalizedAmount, reason: reason?.trim() || "Manual adjustment" },
    });
    return jsonOk({ balance: profile.creditBalance });
  } catch (error) {
    return jsonError(getErrorMessage(error));
  }
}
