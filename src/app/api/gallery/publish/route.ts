import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { publishImage } from "@/server/bff/generation";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const publishSchema = z.object({
  generatedImageId: z.string().trim().min(1, "请选择作品").max(128),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const parsed = await parseJson(request, publishSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const galleryImage = await publishImage(parsed.data.generatedImageId, current.profile.id);
    return jsonOk({ galleryImage });
  });
}
