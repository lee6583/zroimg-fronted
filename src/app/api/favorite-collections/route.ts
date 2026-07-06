import { getCurrentUserProfile } from "@/server/auth";
import { createFavoriteCollection, listFavoriteCollections } from "@/server/favorites";
import { jsonError, jsonOk } from "@/server/http";

export async function GET() {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const collections = await listFavoriteCollections(current.profile.id);
  return jsonOk({ collections });
}

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { name } = (await request.json()) as { name?: string };
  if (!name?.trim()) {
    return jsonError("请输入合集名称");
  }

  const collection = await createFavoriteCollection(current.profile.id, name);
  return jsonOk({ collection });
}
