import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { updateAdminModelStatus } from "@/server/bff/admin-models";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const statusSchema = z.object({
  status: z.enum(["enabled", "disabled"]),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const params = await context.params;
    const parsed = await parseJson(request, statusSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const model = await updateAdminModelStatus(params.id, parsed.data.status);
    return jsonOk({ model });
  });
}
