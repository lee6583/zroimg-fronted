import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { deleteCollection, updateCollectionName } from "@/server/bff/account";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const collectionSchema = z.object({
  name: z.string().trim().min(1, "请输入合集名称").max(64, "合集名称最多 64 位"),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, collectionSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const collection = await updateCollectionName(current.profile.id, id, parsed.data.name);
    return jsonOk({ collection });
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const { id } = await context.params;

    await deleteCollection(current.profile.id, id);
    return jsonOk({ ok: true });
  });
}
