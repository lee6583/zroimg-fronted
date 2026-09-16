import { getCurrentUserProfile } from "@/server/auth";
import { listVideoModels } from "@/server/bff/video";
import { handleApi, jsonError, jsonOk } from "@/server/http";

export async function GET() {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const models = await listVideoModels();
    return jsonOk({ models });
  });
}
