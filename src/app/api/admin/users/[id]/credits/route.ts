import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { addAuditLog, adjustProfileCredits } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const creditsSchema = z.object({
  amount: z
    .number()
    .int()
    .min(-1_000_000)
    .max(1_000_000)
    .refine((value) => value !== 0, "积分变动值不能为 0"),
});

const adjustmentReason = "管理员手动调整";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, creditsSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const { amount } = parsed.data;

    if (isJavaAuthEnabled()) {
      const headers = new Headers(request.headers);
      headers.set("Content-Type", "application/json");
      const javaRequest = new Request(request.url, {
        method: "POST",
        headers,
        body: JSON.stringify({ amount }),
      });
      return proxyRequestToJavaApi(
        javaRequest,
        `/points/admin/users/${encodeURIComponent(id)}/adjust`,
      );
    }

    const profile = adjustProfileCredits(id, amount, adjustmentReason, "adjustment");
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "adjust_credits",
      targetType: "userProfile",
      targetId: id,
      detailJson: { amount },
    });
    return jsonOk({ balance: profile.creditBalance });
  });
}
