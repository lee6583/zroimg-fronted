import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { createConversation, listConversations } from "@/server/bff/generation";
import { jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const conversationSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
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

export async function GET() {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const conversations = await listConversations(current.profile.id);
  return jsonOk({
    conversations: conversations.map(serializeConversation),
  });
}

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const parsed = await parseJson(request, conversationSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const { title } = parsed.data;
  const conversation = await createConversation(current.profile.id, title || "新对话");
  return jsonOk({
    conversation: serializeConversation(conversation),
  });
}
