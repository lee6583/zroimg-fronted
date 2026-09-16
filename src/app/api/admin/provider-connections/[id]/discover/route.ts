import { getCurrentUserProfile } from "@/server/auth";
import { discoverSavedProviderModels } from "@/server/bff/admin-models";
import { handleApi, jsonError, jsonOk } from "@/server/http";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    const models = await discoverSavedProviderModels(id);
    return jsonOk({ models });
  });
}
