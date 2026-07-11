import { getStore, nextId } from "@/server/bff/mock-store";

function taskSummary(conversationId: string) {
  const store = getStore();
  return store.generationTasks
    .filter((task) => task.conversationId === conversationId)
    .sort((a, b) => {
      const timeA = a.createdAt.getTime();
      const timeB = b.createdAt.getTime();
      return timeB - timeA;
    });
}

export async function ensureDefault(profileId: string) {
  const store = getStore();
  const existing = store.generationConversations
    .filter((item) => item.userProfileId === profileId)
    .sort((a, b) => {
      const timeA = a.lastTaskAt?.getTime() || a.updatedAt.getTime();
      const timeB = b.lastTaskAt?.getTime() || b.updatedAt.getTime();
      return timeB - timeA;
    })[0];

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

  return store.generationConversations
    .filter((item) => item.userProfileId === profileId)
    .sort((a, b) => {
      const timeA = a.lastTaskAt?.getTime() || a.updatedAt.getTime();
      const timeB = b.lastTaskAt?.getTime() || b.updatedAt.getTime();
      return timeB - timeA;
    })
    .map((conversation) => ({
      ...conversation,
      tasks: taskSummary(conversation.id).slice(0, 1),
      _count: {
        tasks: taskSummary(conversation.id).length,
      },
    }));
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
  return {
    ...conversation,
    tasks: [],
    _count: { tasks: 0 },
  };
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
  return {
    ...conversation,
    tasks: taskSummary(conversation.id).slice(0, 1),
    _count: { tasks: taskSummary(conversation.id).length },
  };
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
