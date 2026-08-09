import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { estimateVideoPrice } from "@/server/bff/video";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const schema = z.object({
  modelCode: z.string().trim().min(1),
  mode: z.enum(["text_to_video", "image_to_video"]),
  ratio: z.string().trim().min(1).max(32),
  resolution: z.string().trim().min(1).max(32),
  quality: z.string().trim().min(1).max(32),
  durationSeconds: z.number().int().min(1).max(60),
  audio: z.boolean(),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const parsed = await parseJson(request, schema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const price = await estimateVideoPrice(parsed.data);
    return jsonOk({ price });
  });
}
