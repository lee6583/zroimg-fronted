import { getStore, nextId } from "@/server/mock-store";
import type { MockFeedbackStatus, MockFeedbackType } from "@/server/mock-store";

function includesText(value: string, query?: string) {
  if (!query) return true;
  return value.toLowerCase().includes(query.toLowerCase());
}

function attachTicketMessages(ticketId: string) {
  const store = getStore();

  return store.feedbackMessages
    .filter((item) => item.ticketId === ticketId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((message) => {
      const authorProfile = store.profiles.find((profile) => profile.id === message.authorProfileId)!;
      return {
        ...message,
        authorProfile,
      };
    });
}

export async function listFeedbackTicketsForUser(userProfileId: string) {
  const store = getStore();

  return store.feedbackTickets
    .filter((ticket) => ticket.userProfileId === userProfileId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((ticket) => ({
      ...ticket,
      messages: attachTicketMessages(ticket.id),
    }));
}

export async function createFeedbackTicket(input: {
  userProfileId: string;
  type: MockFeedbackType;
  subject: string;
  content: string;
}) {
  const store = getStore();
  const ticket = {
    id: nextId("ticket"),
    userProfileId: input.userProfileId,
    type: input.type,
    status: "open" as const,
    subject: input.subject.trim(),
    content: input.content.trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastMessageAt: new Date(),
  };
  store.feedbackTickets.unshift(ticket);
  store.feedbackMessages.push({
    id: nextId("message"),
    ticketId: ticket.id,
    authorProfileId: input.userProfileId,
    isAdmin: false,
    body: input.content.trim(),
    createdAt: new Date(),
  });
  return {
    ...ticket,
    messages: attachTicketMessages(ticket.id),
  };
}

export async function addFeedbackMessage(input: {
  ticketId: string;
  authorProfileId: string;
  isAdmin: boolean;
  body: string;
}) {
  const store = getStore();
  const ticket = store.feedbackTickets.find((item) => item.id === input.ticketId);
  if (!ticket) {
    throw new Error("反馈不存在");
  }
  if (ticket.status === "closed") {
    throw new Error("反馈已关闭");
  }

  store.feedbackMessages.push({
    id: nextId("message"),
    ticketId: ticket.id,
    authorProfileId: input.authorProfileId,
    isAdmin: input.isAdmin,
    body: input.body.trim(),
    createdAt: new Date(),
  });
  ticket.updatedAt = new Date();
  ticket.lastMessageAt = new Date();
  if (input.isAdmin && ticket.status === "open") {
    ticket.status = "in_progress";
  }
  return ticket;
}

export async function listAdminFeedbackTickets(input: {
  q?: string;
  status?: string;
  type?: string;
  page: number;
  pageSize: number;
}) {
  const store = getStore();
  const q = input.q?.trim();
  const status = input.status as MockFeedbackStatus | undefined;
  const type = input.type as MockFeedbackType | undefined;

  const filtered = store.feedbackTickets
    .filter((ticket) => (status ? ticket.status === status : true))
    .filter((ticket) => (type ? ticket.type === type : true))
    .filter((ticket) => {
      const userProfile = store.profiles.find((profile) => profile.id === ticket.userProfileId)!;
      const user = store.users.find((entry) => entry.id === userProfile.userId)!;
      return (
        includesText(ticket.subject, q) ||
        includesText(ticket.content, q) ||
        includesText(user.email, q)
      );
    })
    .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

  const start = (input.page - 1) * input.pageSize;
  const pageItems = filtered.slice(start, start + input.pageSize);

  return {
    tickets: pageItems.map((ticket) => {
      const userProfile = store.profiles.find((profile) => profile.id === ticket.userProfileId)!;
      const user = store.users.find((entry) => entry.id === userProfile.userId)!;
      return {
        ...ticket,
        userProfile: {
          ...userProfile,
          user,
        },
        messages: attachTicketMessages(ticket.id),
      };
    }),
    total: filtered.length,
    pageSize: input.pageSize,
  };
}

export async function updateFeedbackTicketStatus(ticketId: string, status: MockFeedbackStatus) {
  const ticket = getStore().feedbackTickets.find((item) => item.id === ticketId);
  if (!ticket) {
    throw new Error("反馈不存在");
  }
  ticket.status = status;
  ticket.updatedAt = new Date();
  return ticket;
}
