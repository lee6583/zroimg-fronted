import { getCurrentUserProfile } from "@/server/auth";
import { getVideoTask } from "@/server/bff/video";
import { handleApi, jsonError, jsonOk } from "@/server/http";

export async function GET(_request: Request, context: RouteContext<"/api/video/tasks/[taskNo]">) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const { taskNo } = await context.params;
    const task = await getVideoTask(taskNo);
    return jsonOk({ task });
  });
}
