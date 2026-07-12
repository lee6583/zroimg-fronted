import { getCurrentUserProfile } from "@/server/auth";
import { getMediaSignedUrl, listTasks, requireConversation } from "@/server/bff/generation";
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
    const serializedTasks = await Promise.all(
      tasks.map(async (task) => {
        const imageUrls = await Promise.all(
          task.outputs.map((output) => {
            const assetId = output.thumbnailAsset?.id || output.outputAsset.id;
            return getMediaSignedUrl(assetId);
          }),
        );

        const result = {
          id: task.id,
          prompt: task.prompt,
          mode: task.mode,
          status: task.status,
          size: task.size,
          imageCount: task.imageCount,
          costCredits: task.costCredits,
          createdAt: task.createdAt.toISOString(),
          imageUrls: imageUrls,
        };

        return result;
      }),
    );
    return jsonOk({ tasks: serializedTasks });
  });
}
