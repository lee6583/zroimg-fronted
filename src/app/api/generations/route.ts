import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { createTask, requireConversation } from "@/server/bff/generation";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const mediaIdSchema = z
  .string()
  .min(1, "参考图 ID 不能为空")
  .max(128, "参考图 ID 不能超过 128 个字符");

const generationSchema = z.object({
  conversationId: z.string().trim().min(1, "请选择对话").max(128),
  model: z.string().trim().min(1, "请选择模型").max(100),
  prompt: z.string().trim().min(1, "请输入提示词").max(4000),
  mode: z.enum(["text", "edit"]),
  quality: z.string().trim().min(1, "请选择画质").max(50),
  outputFormat: z.string().trim().min(1, "请选择图片格式").max(50),
  ratio: z.string().regex(/^\d+:\d+$/, "图片比例格式不正确"),
  resolution: z.string().trim().min(1, "请选择分辨率").max(20),
  size: z.string().trim().min(1, "图片尺寸不能为空").max(50),
  imageCount: z.number().int().min(1).max(20),
  inputMediaIds: z.array(mediaIdSchema).max(1, "图生图当前只支持 1 张参考图"),
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
      model: payload.model,
      prompt: payload.prompt,
      mode: payload.mode,
      quality: payload.quality,
      outputFormat: payload.outputFormat,
      ratio: payload.ratio,
      resolution: payload.resolution,
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
