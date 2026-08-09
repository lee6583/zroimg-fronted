import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { updateAdminCreditPackageStatus } from "@/server/bff/orders";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const statusSchema = z.object({ enabled: z.boolean() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, statusSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const packageItem = await updateAdminCreditPackageStatus(id, parsed.data.enabled);
    return jsonOk({ package: packageItem });
  });
}
