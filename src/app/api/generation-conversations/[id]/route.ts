import { getCurrentUserProfile } from "@/server/auth";
import {
  deleteGenerationConversation,
  updateGenerationConversationTitle,
} from "@/server/bff/generation";
import { jsonError, jsonOk } from "@/server/http";

type SerializedConversationInput = {
  id: string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
  lastTaskAt: Date | null;
  _count: { tasks: number };
  tasks: Array<{ status: string; costCredits: number }>;
};

function serializeConversation(conversation: SerializedConversationInput) {
  return {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
    lastTaskAt: conversation.lastTaskAt?.toISOString() ?? null,
    _count: conversation._count,
    tasks: conversation.tasks.map((task) => ({
      status: task.status,
      costCredits: task.costCredits,
    })),
  };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { id } = await context.params;
  const { title } = (await request.json()) as { title?: string };

  try {
    const conversation = await updateGenerationConversationTitle(current.profile.id, id, title || "");
    return jsonOk({ conversation: serializeConversation(conversation) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "更新失败");
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { id } = await context.params;

  try {
    await deleteGenerationConversation(current.profile.id, id);
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "删除失败");
  }
}
