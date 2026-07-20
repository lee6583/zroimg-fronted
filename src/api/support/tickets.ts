import { request } from "@/utils/request";
import type {
  AdminReplyTicketRequest,
  AdminReplyTicketResponse,
  CreateTicketRequest,
  CreateTicketResponse,
  ListTicketsRequest,
  ListTicketsResponse,
  ReplyTicketRequest,
  ReplyTicketResponse,
  UpdateTicketStatusRequest,
  UpdateTicketStatusResponse,
  UploadTicketAttachmentResponse,
} from "@/types/feedback";

function listTickets(params: ListTicketsRequest) {
  return request<ListTicketsResponse>({
    url: "/api/tickets",
    params,
  });
}

function createTicket(data: CreateTicketRequest) {
  return request<CreateTicketResponse>({
    url: "/api/tickets",
    method: "POST",
    data,
  });
}

function uploadAttachment(data: FormData) {
  return request<UploadTicketAttachmentResponse>({
    url: "/api/media/upload",
    method: "POST",
    body: data,
  });
}

function replyTicket(ticketId: string, data: ReplyTicketRequest) {
  return request<ReplyTicketResponse>({
    url: `/api/tickets/${ticketId}/messages`,
    method: "POST",
    data,
  });
}

function adminReply(ticketId: string, data: AdminReplyTicketRequest) {
  return request<AdminReplyTicketResponse>({
    url: `/api/admin/tickets/${ticketId}/reply`,
    method: "POST",
    data,
  });
}

function updateStatus(ticketId: string, data: UpdateTicketStatusRequest) {
  return request<UpdateTicketStatusResponse>({
    url: `/api/admin/tickets/${ticketId}/status`,
    method: "POST",
    data,
  });
}

export const ticketsApi = {
  listTickets,
  createTicket,
  uploadAttachment,
  replyTicket,
  adminReply,
  updateStatus,
};
