import type { FeedbackStatus, FeedbackType } from "@/utils/feedback";

type TicketMessage = {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
  authorName: string;
};

type TicketAttachment = {
  id: string;
  fileName: string | null;
  url: string;
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
  attachments: TicketAttachment[];
};

type TicketStatusFilter = "all" | "open" | "in_progress" | "processed";

type TicketListSummary = {
  all: number;
  open: number;
  inProgress: number;
  processed: number;
};

type ListTicketsRequest = {
  page: number;
  pageSize: number;
  status?: TicketStatusFilter;
};

type ListTicketsResponse = {
  tickets: TicketItem[];
  total: number;
  page: number;
  pageSize: number;
  summary: TicketListSummary;
};

type CreateTicketRequest = {
  type: string;
  subject: string;
  content: string;
  attachmentMediaIds?: string[];
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

type UploadTicketAttachmentResponse = {
  media: {
    id: string;
    fileName: string | null;
    kind: "input" | "output";
  };
};

export type {
  TicketMessage,
  TicketAttachment,
  TicketItem,
  TicketStatusFilter,
  TicketListSummary,
  ListTicketsRequest,
  ListTicketsResponse,
  CreateTicketRequest,
  CreateTicketResponse,
  ReplyTicketRequest,
  ReplyTicketResponse,
  AdminReplyTicketRequest,
  AdminReplyTicketResponse,
  UpdateTicketStatusRequest,
  UpdateTicketStatusResponse,
  UploadTicketAttachmentResponse,
};
