import { getErrorMessage } from "@/utils/error";
import { getCurrentUserProfile } from "@/server/auth";
import { publishGeneratedImage } from "@/server/bff/generation";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { generatedImageId } = (await request.json()) as { generatedImageId?: string };
  if (!generatedImageId) {
    return jsonError("作品不存在");
  }

  try {
    const galleryImage = await publishGeneratedImage(generatedImageId, current.profile.id);
    return jsonOk({ galleryImage });
  } catch (error) {
    return jsonError(getErrorMessage(error));
  }
}
