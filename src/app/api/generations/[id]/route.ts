import { getCurrentUserProfile } from "@/server/auth";
import { getGenerationTaskForUser } from "@/server/bff/generation";
import { jsonError, jsonOk } from "@/server/http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { id } = await context.params;
  const task = await getGenerationTaskForUser(current.profile.id, id);
  if (!task) {
    return jsonError("任务不存在", 404);
  }

  return jsonOk({
    task: {
      id: task.id,
      status: task.status,
    },
  });
}
