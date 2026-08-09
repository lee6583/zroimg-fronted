import { getCurrentUserProfile } from "@/server/auth";
import { setAdminModelDefault } from "@/server/bff/admin-models";
import { handleApi, jsonError, jsonOk } from "@/server/http";

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const params = await context.params;
    const model = await setAdminModelDefault(params.id);
    return jsonOk({ model });
  });
}
