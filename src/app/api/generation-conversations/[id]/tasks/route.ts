import { getErrorMessage } from "@/utils/error";
import { getCurrentUserProfile } from "@/server/auth";
import { requireOwnedConversation } from "@/server/bff/generation";
import { listGenerationTasks } from "@/server/bff/generation";
import { getMediaSignedUrl } from "@/server/bff/generation";
import { jsonError, jsonOk } from "@/server/http";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { id } = await context.params;

  try {
    await requireOwnedConversation(current.profile.id, id);
    const tasks = await listGenerationTasks(current.profile.id, id);
    const serializedTasks = await Promise.all(
      tasks.map(async (task) => ({
        id: task.id,
        prompt: task.prompt,
        mode: task.mode,
        status: task.status,
        size: task.size,
        imageCount: task.imageCount,
        costCredits: task.costCredits,
        createdAt: task.createdAt.toISOString(),
        imageUrls: await Promise.all(
          task.outputs.map((output) => getMediaSignedUrl(output.thumbnailAsset?.id || output.outputAsset.id)),
        ),
      })),
    );
    return jsonOk({ tasks: serializedTasks });
  } catch (error) {
    return jsonError(getErrorMessage(error));
  }
}
