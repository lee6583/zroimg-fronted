import { getCurrentUserProfile } from "@/server/auth";
import {
  deleteFavoriteCollection,
  updateFavoriteCollectionName,
} from "@/server/favorites";
import { jsonError, jsonOk } from "@/server/http";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { id } = await context.params;
  const { name } = (await request.json()) as { name?: string };
  if (!name?.trim()) {
    return jsonError("请输入合集名称");
  }

  try {
    const collection = await updateFavoriteCollectionName(current.profile.id, id, name);
    return jsonOk({ collection });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "更新失败");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { id } = await context.params;

  try {
    await deleteFavoriteCollection(current.profile.id, id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "删除失败");
  }
}
