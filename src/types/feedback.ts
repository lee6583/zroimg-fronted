import type { FeedbackStatus, FeedbackType } from "@/utils/feedback";

type TicketMessage = {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
  authorName: string;
};

type TicketItem = {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  subject: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

type CreateTicketRequest = {
  type: string;
  subject: string;
  content: string;
};

type CreateTicketResponse = {
  ticket: TicketItem;
};

type ReplyTicketRequest = {
  body: string;
};

type ReplyTicketResponse = {
  ok?: boolean;
};

type AdminReplyTicketRequest = ReplyTicketRequest;

type AdminReplyTicketResponse = ReplyTicketResponse;

type UpdateTicketStatusRequest = {
  status: string;
};

type UpdateTicketStatusResponse = {
  ok?: boolean;
};

export type {
  TicketMessage,
  TicketItem,
  CreateTicketRequest,
  CreateTicketResponse,
  ReplyTicketRequest,
  ReplyTicketResponse,
  AdminReplyTicketRequest,
  AdminReplyTicketResponse,
  UpdateTicketStatusRequest,
  UpdateTicketStatusResponse,
};
