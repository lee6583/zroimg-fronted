import { getCurrentUserProfile } from "@/server/auth";
import { addImageToFavoriteCollection } from "@/server/favorites";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { id } = await context.params;
  const { generatedImageId } = (await request.json()) as { generatedImageId?: string };
  if (!generatedImageId) {
    return jsonError("请选择作品");
  }

  try {
    const item = await addImageToFavoriteCollection(current.profile.id, id, generatedImageId);
    return jsonOk({ item });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "收藏失败");
  }
}
