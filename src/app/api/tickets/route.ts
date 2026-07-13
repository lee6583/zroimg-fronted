import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { createTicket, listTicketsForUser } from "@/server/bff/account";
import { jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const ticketSchema = z.object({
  type: z.enum(["bug", "billing", "generation", "account", "suggestion", "other"]),
  subject: z.string().trim().min(1, "请输入标题").max(120, "标题最多 120 位"),
  content: z.string().trim().min(1, "请输入详细描述").max(5000, "详细描述最多 5000 位"),
});

export async function GET() {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const tickets = await listTicketsForUser(current.profile.id);
  return jsonOk({ tickets });
}

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const parsed = await parseJson(request, ticketSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const payload = parsed.data;

  const ticket = await createTicket({
    userProfileId: current.profile.id,
    type: payload.type,
    subject: payload.subject,
    content: payload.content,
  });

  const messages = ticket.messages.map((message) => {
    const result = {
      id: message.id,
      body: message.body,
      isAdmin: message.isAdmin,
      createdAt: message.createdAt.toISOString(),
      authorName: message.authorProfile.username,
    };

    return result;
  });

  const ticketItem = {
    id: ticket.id,
    type: ticket.type,
    status: ticket.status,
    subject: ticket.subject,
    content: ticket.content,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    messages: messages,
  };

  return jsonOk({
    ticket: ticketItem,
  });
}
