import type { FeedbackStatus, FeedbackType } from "@/utils/feedback";

export type TicketMessage = {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
  authorName: string;
};

export type TicketItem = {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

export type CreateTicketRequest = {
  type: string;
  subject: string;
  content: string;
};

export type CreateTicketResponse = {
  ticket: TicketItem;
};

export type ReplyTicketRequest = {
  body: string;
};

export type ReplyTicketResponse = {
  ok?: boolean;
};

export type AdminReplyTicketRequest = ReplyTicketRequest;

export type AdminReplyTicketResponse = ReplyTicketResponse;

export type UpdateTicketStatusRequest = {
  status: string;
};

export type UpdateTicketStatusResponse = {
  ok?: boolean;
};
