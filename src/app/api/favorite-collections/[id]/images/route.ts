import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { addImageToCollection } from "@/server/bff/account";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const favoriteSchema = z.object({
  generatedImageId: z.string().trim().min(1, "请选择作品").max(128),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, favoriteSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const item = await addImageToCollection(current.profile.id, id, parsed.data.generatedImageId);
    return jsonOk({ item });
  });
}
