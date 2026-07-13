import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { createCollection, listCollections } from "@/server/bff/account";
import { jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const collectionSchema = z.object({
  name: z.string().trim().min(1, "请输入合集名称").max(64, "合集名称最多 64 位"),
});

export async function GET() {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const collections = await listCollections(current.profile.id);
  return jsonOk({ collections });
}

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const parsed = await parseJson(request, collectionSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const collection = await createCollection(current.profile.id, parsed.data.name);
  return jsonOk({ collection });
}
