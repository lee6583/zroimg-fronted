import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { deleteConversation, updateTitle } from "@/server/bff/generation";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const renameSchema = z.object({
  title: z.string().trim().min(1, "对话名称不能为空").max(80, "对话名称最多 80 位"),
});

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
  const tasks = conversation.tasks.map((task) => {
    const result = {
      status: task.status,
      costCredits: task.costCredits,
    };

    return result;
  });

  const result = {
    id: conversation.id,
    title: conversation.title,
    updatedAt: conversation.updatedAt.toISOString(),
    createdAt: conversation.createdAt.toISOString(),
    lastTaskAt: conversation.lastTaskAt?.toISOString() ?? null,
    _count: conversation._count,
    tasks: tasks,
  };

  return result;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, renameSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const { title } = parsed.data;

    const conversation = await updateTitle(current.profile.id, id, title);
    return jsonOk({ conversation: serializeConversation(conversation) });
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const { id } = await context.params;

    await deleteConversation(current.profile.id, id);
    return jsonOk({ ok: true });
  });
}
