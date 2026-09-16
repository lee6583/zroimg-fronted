import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { updateAdminCreditPackageRecommend } from "@/server/bff/orders";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const recommendSchema = z.object({ recommended: z.boolean() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, recommendSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const packageItem = await updateAdminCreditPackageRecommend(id, parsed.data.recommended);
    return jsonOk({ package: packageItem });
  });
}
