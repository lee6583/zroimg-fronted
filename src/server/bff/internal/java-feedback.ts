import "server-only";

import { z } from "zod";
import { requestJavaApiData } from "@/server/java-api";
import type { AdminFeedbackTicketRecord, FeedbackTicketRecord } from "@/types/feedback";
import type { FeedbackStatus, FeedbackType } from "@/utils/feedback";

const javaMessageSchema = z.object({
  id: z.number(),
  body: z.string(),
  isAdmin: z.boolean(),
  createdAt: z.string(),
  authorName: z.string(),
});

const javaAttachmentSchema = z.object({
  id: z.number(),
  mediaId: z.number(),
  fileName: z.string().nullable(),
  url: z.string(),
});

const javaTicketSchema = z.object({
  id: z.number(),
  type: z.string(),
  status: z.string(),
  subject: z.string(),
  content: z.string(),
  createTime: z.string(),
  updateTime: z.string(),
  messages: z.array(javaMessageSchema).optional(),
  attachments: z.array(javaAttachmentSchema).optional(),
});

const javaUserSchema = z.object({
  id: z.number(),
  email: z.string(),
  name: z.string(),
});

const javaAdminTicketSchema = javaTicketSchema.extend({
  user: javaUserSchema.nullable().optional(),
});

const javaUserPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(javaTicketSchema),
});

const javaAdminPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(javaAdminTicketSchema),
});

type UserTicketQuery = {
  page: number;
  pageSize: number;
  status?: string;
};

type AdminTicketQuery = {
  q?: string;
  status?: string;
  type?: string;
  page: number;
  pageSize: number;
};

function buildUserPath(query: UserTicketQuery) {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));

  if (query.status && query.status !== "all") {
    params.set("status", query.status);
  }

  return `/feedback/user/tickets?${params.toString()}`;
}

function buildAdminPath(query: AdminTicketQuery) {
  const params = new URLSearchParams();
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));

  if (query.q) params.set("q", query.q);
  if (query.status) params.set("status", query.status);
  if (query.type) params.set("type", query.type);

  return `/feedback/admin/tickets?${params.toString()}`;
}

function readType(value: string): FeedbackType {
  if (
    value === "bug" ||
    value === "billing" ||
    value === "generation" ||
    value === "account" ||
    value === "suggestion"
  ) {
    return value;
  }

  return "other";
}

function readStatus(value: string): FeedbackStatus {
  if (value === "open" || value === "in_progress" || value === "resolved") {
    return value;
  }

  return "closed";
}

function toMessage(message: z.infer<typeof javaMessageSchema>) {
  return {
    id: String(message.id),
    body: message.body,
    isAdmin: message.isAdmin,
    createdAt: new Date(message.createdAt),
    authorProfile: {
      username: message.authorName,
    },
  };
}

function toAttachment(attachment: z.infer<typeof javaAttachmentSchema>) {
  return {
    id: String(attachment.id),
    fileName: attachment.fileName,
    url: `/api/media/feedback-attachments/${attachment.id}`,
  };
}

function toUserTicket(ticket: z.infer<typeof javaTicketSchema>): FeedbackTicketRecord {
  return {
    id: String(ticket.id),
    type: readType(ticket.type),
    status: readStatus(ticket.status),
    subject: ticket.subject,
    content: ticket.content,
    createdAt: new Date(ticket.createTime),
    updatedAt: new Date(ticket.updateTime),
    messages: (ticket.messages ?? []).map(toMessage),
    attachments: (ticket.attachments ?? []).map(toAttachment),
  };
}

function toAdminTicket(ticket: z.infer<typeof javaAdminTicketSchema>): AdminFeedbackTicketRecord {
  const user = ticket.user;
  const userProfile = {
    username: user?.name ?? "-",
    user: {
      email: user?.email ?? "-",
      name: user?.name ?? "-",
    },
  };

  return {
    id: String(ticket.id),
    type: readType(ticket.type),
    status: readStatus(ticket.status),
    subject: ticket.subject,
    content: ticket.content,
    createdAt: new Date(ticket.createTime),
    updatedAt: new Date(ticket.updateTime),
    userProfile,
    messages: (ticket.messages ?? []).map(toMessage),
    attachments: (ticket.attachments ?? []).map(toAttachment),
  };
}

async function countUserTickets(status?: string) {
  const path = buildUserPath({ page: 1, pageSize: 1, status });
  const payload = await requestJavaApiData<unknown>(path);
  return javaUserPageSchema.parse(payload).total;
}

export async function listForUserPage(input: UserTicketQuery) {
  const payload = await requestJavaApiData<unknown>(buildUserPath(input));
  const page = javaUserPageSchema.parse(payload);
  const [all, open, inProgress, processed] = await Promise.all([
    countUserTickets(),
    countUserTickets("open"),
    countUserTickets("in_progress"),
    countUserTickets("processed"),
  ]);

  return {
    tickets: page.list.map(toUserTicket),
    total: page.total,
    page: input.page,
    pageSize: input.pageSize,
    summary: { all, open, inProgress, processed },
  };
}

export async function listForUser(profileId: string) {
  void profileId;
  const result = await listForUserPage({ page: 1, pageSize: 50 });
  return result.tickets;
}

export async function createTicket(input: {
  type: string;
  subject: string;
  content: string;
  attachmentMediaIds?: string[];
}) {
  const payload = await requestJavaApiData<unknown>("/feedback/user/tickets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: input.type,
      subject: input.subject,
      content: input.content,
      attachmentMediaIds: input.attachmentMediaIds?.map(Number),
    }),
  });

  return toUserTicket(javaTicketSchema.parse(payload));
}

export async function addMessage(input: { ticketId: string; body: string }) {
  await requestJavaApiData<unknown>(
    `/feedback/user/tickets/${encodeURIComponent(input.ticketId)}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: input.body }),
    },
  );
}

export async function listForAdmin(input: AdminTicketQuery) {
  const payload = await requestJavaApiData<unknown>(buildAdminPath(input));
  const page = javaAdminPageSchema.parse(payload);

  return {
    tickets: page.list.map(toAdminTicket),
    total: page.total,
    page: input.page,
    pageSize: input.pageSize,
  };
}

export async function getForAdmin(ticketId: string) {
  const payload = await requestJavaApiData<unknown>(
    `/feedback/admin/tickets/${encodeURIComponent(ticketId)}`,
  );
  return toAdminTicket(javaAdminTicketSchema.parse(payload));
}

export async function updateStatus(ticketId: string, status: string) {
  await requestJavaApiData<unknown>(
    `/feedback/admin/tickets/${encodeURIComponent(ticketId)}/status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
}

export async function reply(input: { ticketId: string; body: string }) {
  await requestJavaApiData<unknown>(
    `/feedback/admin/tickets/${encodeURIComponent(input.ticketId)}/reply`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: input.body }),
    },
  );
}
