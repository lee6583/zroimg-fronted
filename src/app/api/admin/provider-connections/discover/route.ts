import { getCurrentUserProfile } from "@/server/auth";
import { discoverProviderModels } from "@/server/bff/admin-models";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";
import { discoverSchema } from "../schema";

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const parsed = await parseJson(request, discoverSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const models = await discoverProviderModels(parsed.data);
    return jsonOk({ models });
  });
}
