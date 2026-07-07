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

