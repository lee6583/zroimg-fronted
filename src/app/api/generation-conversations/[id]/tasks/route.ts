import { getCurrentUserProfile } from "@/server/auth";
import { listTasks, requireConversation, serializeTask } from "@/server/bff/generation";
import { handleApi, jsonError, jsonOk } from "@/server/http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const { id } = await context.params;

    await requireConversation(current.profile.id, id);
    const tasks = await listTasks(current.profile.id, id);
    const serializedTasks = await Promise.all(tasks.map(serializeTask));
    return jsonOk({ tasks: serializedTasks });
  });
}
