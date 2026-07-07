import { request } from "@/utils/request";

export function createTicket(data: { type: string; subject: string; content: string }) {
  return request<{ ticket: unknown }>({
    url: "/api/tickets",
    method: "POST",
    data,
  });
}

export function replyTicket(ticketId: string, data: { body: string }) {
  return request<{ ok?: boolean }>({
    url: `/api/tickets/${ticketId}/messages`,
    method: "POST",
    data,
  });
}

export function adminReplyTicket(ticketId: string, data: { body: string }) {
  return request<{ ok?: boolean }>({
    url: `/api/admin/tickets/${ticketId}/reply`,
    method: "POST",
    data,
  });
}

export function adminUpdateTicketStatus(ticketId: string, data: { status: string }) {
  return request<{ ok?: boolean }>({
    url: `/api/admin/tickets/${ticketId}/status`,
    method: "POST",
    data,
  });
}
