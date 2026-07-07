import { getCurrentUserProfile } from "@/server/auth";
import { createGenerationConversation, listGenerationConversations } from "@/server/bff/generation";
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

export async function GET() {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const conversations = await listGenerationConversations(current.profile.id);
  return jsonOk({
    conversations: conversations.map(serializeConversation),
  });
}

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { title } = (await request.json()) as { title?: string };
  const conversation = await createGenerationConversation(current.profile.id, title || "新对话");
  return jsonOk({
    conversation: serializeConversation(conversation),
  });
}
