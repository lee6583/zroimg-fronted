import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { createTicket, listTicketsForUserPage } from "@/server/bff/account";
import { jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";
import type { TicketStatusFilter } from "@/types/feedback";

const ticketSchema = z.object({
  type: z.enum(["bug", "billing", "generation", "account", "suggestion", "other"]),
  subject: z.string().trim().min(1, "请输入标题").max(120, "标题最大 120 位"),
  content: z.string().trim().min(1, "请输入详细描述").max(5000, "详细描述最大 5000 位"),
  attachmentMediaIds: z.array(z.string().trim().min(1, "附件 ID 不能为空")).max(4, "最多上传 4 张附件").optional(),
});

const statusFilters = new Set<TicketStatusFilter>(["all", "open", "in_progress", "processed"]);
const defaultPage = 1;
const defaultPageSize = 5;
const maxPageSize = 50;

type TicketRecord = Awaited<ReturnType<typeof listTicketsForUserPage>>["tickets"][number];

function normalizePage(value: string | null) {
  const page = Number(value || defaultPage);
  if (!Number.isFinite(page)) return defaultPage;
  return Math.max(1, Math.floor(page));
}

function normalizePageSize(value: string | null) {
  const pageSize = Number(value || defaultPageSize);
  if (!Number.isFinite(pageSize)) return defaultPageSize;
  return Math.min(maxPageSize, Math.max(1, Math.floor(pageSize)));
}

function normalizeStatus(value: string | null) {
  if (!value) return "all" satisfies TicketStatusFilter;
  return statusFilters.has(value as TicketStatusFilter) ? (value as TicketStatusFilter) : "all";
}

function toTicketItem(ticket: TicketRecord) {
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
    messages,
    attachments: ticket.attachments,
  };

  return ticketItem;
}

export async function GET(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const url = new URL(request.url);
  const page = normalizePage(url.searchParams.get("page"));
  const pageSize = normalizePageSize(url.searchParams.get("pageSize"));
  const status = normalizeStatus(url.searchParams.get("status"));
  const result = await listTicketsForUserPage({
    profileId: current.profile.id,
    status,
    page,
    pageSize,
  });

  return jsonOk({
    tickets: result.tickets.map(toTicketItem),
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    summary: result.summary,
  });
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
    attachmentMediaIds: payload.attachmentMediaIds,
  });

  return jsonOk({
    ticket: toTicketItem(ticket),
  });
}
