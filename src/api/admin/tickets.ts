import { request } from "@/utils/request";
import type {
  ReplyTicketRequest,
  TicketOperationResponse,
  UpdateTicketStatusRequest,
} from "@/types/admin";

function reply(ticketId: string, data: ReplyTicketRequest) {
  return request<TicketOperationResponse>({
    url: `/api/feedback/admin/tickets/${ticketId}/reply`,
    method: "POST",
    data,
  });
}

function updateStatus(ticketId: string, data: UpdateTicketStatusRequest) {
  return request<TicketOperationResponse>({
    url: `/api/feedback/admin/tickets/${ticketId}/status`,
    method: "POST",
    data,
  });
}

export const adminTicketsApi = {
  reply,
  updateStatus,
};
