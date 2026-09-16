import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { updateAdminCreditPackageSort } from "@/server/bff/orders";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const sortSchema = z.object({ sort: z.number().int() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, sortSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const packageItem = await updateAdminCreditPackageSort(id, parsed.data.sort);
    return jsonOk({ package: packageItem });
  });
}
