import { getStore, nextId } from "@/server/bff/mock-store";
import type { MockFeedbackStatus, MockFeedbackType } from "@/server/bff/mock-store";

function includesText(value: string, query?: string) {
  // 没有搜索关键词时，默认匹配成功。
  if (!query) {
    return true;
  }

  const lowerValue = value.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const isIncluded = lowerValue.includes(lowerQuery);

  return isIncluded;
}

function attachMessages(ticketId: string) {
  const store = getStore();

  // 第一步：找出属于当前反馈工单的消息。
  const ticketMessages = store.feedbackMessages.filter((message) => {
    return message.ticketId === ticketId;
  });

  // 第二步：按照消息创建时间，从早到晚排序。
  ticketMessages.sort((messageA, messageB) => {
    const timeA = messageA.createdAt.getTime();
    const timeB = messageB.createdAt.getTime();

    return timeA - timeB;
  });

  // 第三步：给每条消息补充作者信息。
  const messagesWithAuthor = ticketMessages.map((message) => {
    const authorProfile = store.profiles.find((profile) => {
      return profile.id === message.authorProfileId;
    });

    if (!authorProfile) {
      throw new Error(`没有找到消息作者：${message.authorProfileId}`);
    }

    const result = {
      ...message,
      authorProfile: authorProfile,
    };

    return result;
  });

  return messagesWithAuthor;
}

export async function listForUser(profileId: string) {
  const store = getStore();

  // 第一步：只保留当前用户自己的反馈工单。
  const userTickets = store.feedbackTickets.filter((ticket) => {
    return ticket.userProfileId === profileId;
  });

  // 第二步：按照更新时间，从新到旧排序。
  userTickets.sort((ticketA, ticketB) => {
    const timeA = ticketA.updatedAt.getTime();
    const timeB = ticketB.updatedAt.getTime();

    return timeB - timeA;
  });

  // 第三步：给每个工单补充消息列表。
  const ticketsWithMessages = userTickets.map((ticket) => {
    const result = {
      ...ticket,
      messages: attachMessages(ticket.id),
    };

    return result;
  });

  return ticketsWithMessages;
}

export async function createTicket(input: {
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
  const result = {
    ...ticket,
    messages: attachMessages(ticket.id),
  };

  return result;
}

export async function addMessage(input: {
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
  if (!input.isAdmin && ticket.userProfileId !== input.authorProfileId) {
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

export async function listForAdmin(input: {
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

  // 第一步：按照状态、类型和关键词过滤工单。
  const filtered = store.feedbackTickets.filter((ticket) => {
    if (status && ticket.status !== status) {
      return false;
    }

    if (type && ticket.type !== type) {
      return false;
    }

    const userProfile = store.profiles.find((profile) => {
      return profile.id === ticket.userProfileId;
    });

    if (!userProfile) {
      throw new Error(`没有找到反馈用户资料：${ticket.userProfileId}`);
    }

    const user = store.users.find((entry) => {
      return entry.id === userProfile.userId;
    });

    if (!user) {
      throw new Error(`没有找到反馈用户：${userProfile.userId}`);
    }

    const subjectMatched = includesText(ticket.subject, q);
    const contentMatched = includesText(ticket.content, q);
    const emailMatched = includesText(user.email, q);

    return subjectMatched || contentMatched || emailMatched;
  });

  // 第二步：按照最后回复时间，从新到旧排序。
  filtered.sort((ticketA, ticketB) => {
    const timeA = ticketA.lastMessageAt.getTime();
    const timeB = ticketB.lastMessageAt.getTime();

    return timeB - timeA;
  });

  const start = (input.page - 1) * input.pageSize;
  const pageItems = filtered.slice(start, start + input.pageSize);

  // 第三步：给当前页工单补充用户和消息。
  const tickets = pageItems.map((ticket) => {
    const userProfile = store.profiles.find((profile) => {
      return profile.id === ticket.userProfileId;
    });

    if (!userProfile) {
      throw new Error(`没有找到反馈用户资料：${ticket.userProfileId}`);
    }

    const user = store.users.find((entry) => {
      return entry.id === userProfile.userId;
    });

    if (!user) {
      throw new Error(`没有找到反馈用户：${userProfile.userId}`);
    }

    const profileWithUser = {
      ...userProfile,
      user: user,
    };

    const result = {
      ...ticket,
      userProfile: profileWithUser,
      messages: attachMessages(ticket.id),
    };

    return result;
  });

  const result = {
    tickets,
    total: filtered.length,
    pageSize: input.pageSize,
  };

  return result;
}

export async function updateStatus(ticketId: string, status: MockFeedbackStatus) {
  const ticket = getStore().feedbackTickets.find((item) => item.id === ticketId);
  if (!ticket) {
    throw new Error("反馈不存在");
  }
  ticket.status = status;
  ticket.updatedAt = new Date();
  return ticket;
}
