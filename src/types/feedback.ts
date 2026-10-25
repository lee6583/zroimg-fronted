import type { FeedbackStatus, FeedbackType } from "@/utils/feedback";
import type { PageResult } from "@/types/api";
import type { MediaAsset } from "@/types/account";

// Java FeedbackAttachmentVO
type TicketAttachment = {
  id: string;
  mediaId: string;
  fileName: string | null;
  url: string;
};

// Java FeedbackMessageVO
type TicketMessage = {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: string;
  authorName: string;
};

// Java FeedbackTicketVO
type TicketItem = {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  subject: string;
  content: string;
  createTime: string;
  updateTime: string;
  messages: TicketMessage[];
  attachments: TicketAttachment[];
};

// Java FeedbackTicketPageVO.Summary
type TicketListSummary = {
  all: number;
  open: number;
  inProgress: number;
  processed: number;
};

// Java FeedbackTicketPageVO
type TicketListPage = PageResult<TicketItem> & {
  summary: TicketListSummary;
};

type FeedbackMessageRecord = {
  id: string;
  body: string;
  isAdmin: boolean;
  createdAt: Date;
  authorProfile: {
    username: string;
  };
};

type FeedbackTicketRecord = {
  id: string;
  type: FeedbackType;
  status: FeedbackStatus;
  subject: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  messages: FeedbackMessageRecord[];
  attachments: TicketAttachment[];
};

type AdminFeedbackTicketRecord = FeedbackTicketRecord & {
  userProfile: {
    username: string;
    user: {
      email: string;
      name: string;
    };
  };
};

type TicketStatusFilter = "all" | "open" | "in_progress" | "processed";

type ListTicketsRequest = {
  page: number;
  pageSize: number;
  status?: TicketStatusFilter;
};

type ListTicketsResponse = TicketListPage;

type CreateTicketRequest = {
  type: string;
  subject: string;
  content: string;
  attachmentMediaIds?: string[];
};

type CreateTicketResponse = TicketItem;

type ReplyTicketRequest = {
  body: string;
};

type ReplyTicketResponse = TicketMessage;

type AdminReplyTicketRequest = ReplyTicketRequest & {
  status: FeedbackStatus;
};

type AdminReplyTicketResponse = { ok: boolean };

type UpdateTicketStatusRequest = {
  status: string;
};

type UpdateTicketStatusResponse = { ok: boolean };

type UploadTicketAttachmentResponse = MediaAsset;

export type {
  TicketMessage,
  TicketAttachment,
  TicketItem,
  TicketListSummary,
  TicketListPage,
  FeedbackMessageRecord,
  FeedbackTicketRecord,
  AdminFeedbackTicketRecord,
  TicketStatusFilter,
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
