import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { createTask, requireConversation } from "@/server/bff/generation";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const generationSchema = z.object({
  conversationId: z.string().trim().min(1, "请选择对话").max(128),
  prompt: z.string().trim().min(1, "请输入提示词").max(4000),
  mode: z.enum(["text", "edit"]),
  quality: z.enum(["low", "medium", "high"]),
  outputFormat: z.enum(["png", "webp", "jpeg"]),
  size: z
    .string()
    .regex(/^\d{2,4}x\d{2,4}$/, "图片尺寸格式不正确")
    .refine((value) => value.split("x").every((item) => Number(item) <= 4096), {
      message: "图片尺寸不能超过 4096",
    }),
  imageCount: z.number().int().min(1).max(4),
  inputMediaIds: z.array(z.string().min(1).max(128)).max(4),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const parsed = await parseJson(request, generationSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const payload = parsed.data;

    await requireConversation(current.profile.id, payload.conversationId);
    const task = await createTask({
      userProfileId: current.profile.id,
      conversationId: payload.conversationId,
      prompt: payload.prompt,
      mode: payload.mode,
      quality: payload.quality,
      outputFormat: payload.outputFormat,
      size: payload.size,
      imageCount: payload.imageCount,
      inputMediaIds: payload.inputMediaIds,
    });

    return jsonOk({
      task: {
        id: task.id,
        prompt: task.prompt,
        mode: task.mode,
        status: task.status,
        size: task.size,
        imageCount: task.imageCount,
        costCredits: task.costCredits,
        createdAt: task.createdAt.toISOString(),
      },
    });
  });
}
