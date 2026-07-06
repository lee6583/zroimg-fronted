import { getCurrentUserProfile } from "@/server/auth";
import { requireOwnedConversation } from "@/server/generation/conversations";
import { createGenerationTask } from "@/server/generation/tasks";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const payload = (await request.json()) as {
    conversationId?: string;
    prompt?: string;
    mode?: "text" | "edit";
    quality?: "low" | "medium" | "high";
    outputFormat?: "png" | "webp" | "jpeg";
    size?: string;
    imageCount?: number;
  };

  if (!payload.conversationId || !payload.prompt?.trim()) {
    return jsonError("请输入提示词");
  }

  try {
    await requireOwnedConversation(current.profile.id, payload.conversationId);
    const task = await createGenerationTask({
      userProfileId: current.profile.id,
      conversationId: payload.conversationId,
      prompt: payload.prompt,
      mode: payload.mode === "edit" ? "edit" : "text",
      quality: payload.quality === "low" || payload.quality === "high" ? payload.quality : "medium",
      outputFormat: payload.outputFormat === "jpeg" || payload.outputFormat === "webp" ? payload.outputFormat : "png",
      size: payload.size || "1024x1024",
      imageCount: Math.min(Math.max(Number(payload.imageCount || 1), 1), 4),
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
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "创建任务失败");
  }
}
