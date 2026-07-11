import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { addAuditLog, adjustProfileCredits } from "@/server/bff/mock-store";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const creditsSchema = z.object({
  amount: z
    .number()
    .int()
    .min(-1_000_000)
    .max(1_000_000)
    .refine((value) => value !== 0, "积分变动值不能为 0"),
  reason: z.string().trim().min(1, "请输入调整原因").max(200, "调整原因最多 200 位"),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, creditsSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const { amount, reason } = parsed.data;

    const profile = adjustProfileCredits(id, amount, reason, "adjustment");
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "adjust_credits",
      targetType: "userProfile",
      targetId: id,
      detailJson: { amount, reason },
    });
    return jsonOk({ balance: profile.creditBalance });
  });
}
