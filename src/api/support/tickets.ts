import { request } from "@/utils/request";
import type {
  CreateTicketRequest,
  CreateTicketResponse,
  ListTicketsRequest,
  ListTicketsResponse,
  ReplyTicketRequest,
  ReplyTicketResponse,
  AdminReplyTicketRequest,
  AdminReplyTicketResponse,
  UpdateTicketStatusRequest,
  UpdateTicketStatusResponse,
  UploadTicketAttachmentResponse,
} from "@/types/feedback";

function listTickets(params: ListTicketsRequest) {
  // Java 不接受 status=all，查询全部时不传 status
  let status = params.status;
  if (status === "all") {
    status = undefined;
  }

  return request<ListTicketsResponse>({
    url: "/api/feedback/user/tickets",
    params: {
      pageNo: params.page,
      pageSize: params.pageSize,
      status,
    },
  });
}

function createTicket(data: CreateTicketRequest) {
  return request<CreateTicketResponse>({
    url: "/api/feedback/user/tickets",
    method: "POST",
    data,
  });
}

function uploadAttachment(data: FormData) {
  return request<UploadTicketAttachmentResponse>({
    url: "/api/media/user/assets",
    method: "POST",
    body: data,
  });
}

function replyTicket(ticketId: string, data: ReplyTicketRequest) {
  return request<ReplyTicketResponse>({
    url: `/api/feedback/user/tickets/${ticketId}/messages`,
    method: "POST",
    data,
  });
}

function adminReply(ticketId: string, data: AdminReplyTicketRequest) {
  return request<AdminReplyTicketResponse>({
    url: `/api/feedback/admin/tickets/${ticketId}/reply`,
    method: "POST",
    data,
  });
}

function updateStatus(ticketId: string, data: UpdateTicketStatusRequest) {
  return request<UpdateTicketStatusResponse>({
    url: `/api/feedback/admin/tickets/${ticketId}/status`,
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
