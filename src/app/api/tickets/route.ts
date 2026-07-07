import { getCurrentUserProfile } from "@/server/auth";
import { createFeedbackTicket, listFeedbackTicketsForUser } from "@/server/bff/account";
import { jsonError, jsonOk } from "@/server/http";

export async function GET() {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const tickets = await listFeedbackTicketsForUser(current.profile.id);
  return jsonOk({ tickets });
}

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const payload = (await request.json()) as {
    type?: "bug" | "billing" | "generation" | "account" | "suggestion" | "other";
    subject?: string;
    content?: string;
  };

  if (!payload.subject?.trim() || !payload.content?.trim()) {
    return jsonError("请填写完整反馈内容");
  }

  const ticket = await createFeedbackTicket({
    userProfileId: current.profile.id,
    type: payload.type || "generation",
    subject: payload.subject,
    content: payload.content,
  });

  return jsonOk({
    ticket: {
      id: ticket.id,
      type: ticket.type,
      status: ticket.status,
      subject: ticket.subject,
      content: ticket.content,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      messages: ticket.messages.map((message) => ({
        id: message.id,
        body: message.body,
        isAdmin: message.isAdmin,
        createdAt: message.createdAt.toISOString(),
        authorName: message.authorProfile.username,
      })),
    },
  });
}
