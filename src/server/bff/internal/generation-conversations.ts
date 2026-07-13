import { getStore, nextId } from "@/server/bff/mock-store";

function taskSummary(conversationId: string) {
  const store = getStore();

  // 第一步：找出当前对话下的生成任务。
  const tasks = store.generationTasks.filter((task) => {
    return task.conversationId === conversationId;
  });

  // 第二步：按照创建时间，从新到旧排序。
  tasks.sort((taskA, taskB) => {
    const timeA = taskA.createdAt.getTime();
    const timeB = taskB.createdAt.getTime();

    return timeB - timeA;
  });

  return tasks;
}

export async function ensureDefault(profileId: string) {
  const store = getStore();

  // 第一步：找出当前用户已有的生图对话。
  const conversations = store.generationConversations.filter((conversation) => {
    return conversation.userProfileId === profileId;
  });

  // 第二步：把最近有任务或最近更新的对话排到最前面。
  conversations.sort((conversationA, conversationB) => {
    const timeA = conversationA.lastTaskAt?.getTime() || conversationA.updatedAt.getTime();
    const timeB = conversationB.lastTaskAt?.getTime() || conversationB.updatedAt.getTime();

    return timeB - timeA;
  });

  const existing = conversations[0];

  if (existing) return existing;

  const conversation = {
    id: nextId("conversation"),
    userProfileId: profileId,
    title: "新对话",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastTaskAt: null,
  };
  store.generationConversations.unshift(conversation);
  return conversation;
}

export async function list(profileId: string) {
  const store = getStore();

  // 第一步：找出当前用户自己的生图对话。
  const conversations = store.generationConversations.filter((conversation) => {
    return conversation.userProfileId === profileId;
  });

  // 第二步：把最近活跃的对话排到前面。
  conversations.sort((conversationA, conversationB) => {
    const timeA = conversationA.lastTaskAt?.getTime() || conversationA.updatedAt.getTime();
    const timeB = conversationB.lastTaskAt?.getTime() || conversationB.updatedAt.getTime();

    return timeB - timeA;
  });

  // 第三步：给对话补充最近任务和任务数量。
  const conversationsWithTasks = conversations.map((conversation) => {
    const tasks = taskSummary(conversation.id);

    const count = {
      tasks: tasks.length,
    };

    const result = {
      ...conversation,
      tasks: tasks.slice(0, 1),
      _count: count,
    };

    return result;
  });

  return conversationsWithTasks;
}

export async function create(profileId: string, title: string) {
  const store = getStore();
  const conversation = {
    id: nextId("conversation"),
    userProfileId: profileId,
    title: title.trim() || "新对话",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastTaskAt: null,
  };
  store.generationConversations.unshift(conversation);

  const count = {
    tasks: 0,
  };

  const result = {
    ...conversation,
    tasks: [],
    _count: count,
  };

  return result;
}

export async function updateTitle(profileId: string, conversationId: string, title: string) {
  const conversation = getStore().generationConversations.find(
    (item) => item.id === conversationId && item.userProfileId === profileId,
  );
  if (!conversation) {
    throw new Error("对话不存在");
  }
  conversation.title = title.trim();
  conversation.updatedAt = new Date();
  const tasks = taskSummary(conversation.id);

  const count = {
    tasks: tasks.length,
  };

  const result = {
    ...conversation,
    tasks: tasks.slice(0, 1),
    _count: count,
  };

  return result;
}

export async function remove(profileId: string, conversationId: string) {
  const store = getStore();
  const index = store.generationConversations.findIndex(
    (item) => item.id === conversationId && item.userProfileId === profileId,
  );
  if (index < 0) {
    throw new Error("对话不存在");
  }
  store.generationConversations.splice(index, 1);
  store.generationTasks = store.generationTasks.filter(
    (task) => task.conversationId !== conversationId,
  );
}

export async function requireOwned(profileId: string, conversationId: string) {
  const conversation = getStore().generationConversations.find(
    (item) => item.id === conversationId && item.userProfileId === profileId,
  );
  if (!conversation) {
    throw new Error("对话不存在");
  }
  return conversation;
}
