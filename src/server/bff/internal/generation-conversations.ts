import { getStore, nextId } from "@/server/bff/mock-store";

function taskSummaryForConversation(conversationId: string) {
  const store = getStore();
  return store.generationTasks
    .filter((task) => task.conversationId === conversationId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getOrCreateDefaultConversation(userProfileId: string) {
  const store = getStore();
  const existing = store.generationConversations
    .filter((item) => item.userProfileId === userProfileId)
    .sort((a, b) => {
      const aTime = a.lastTaskAt?.getTime() || a.updatedAt.getTime();
      const bTime = b.lastTaskAt?.getTime() || b.updatedAt.getTime();
      return bTime - aTime;
    })[0];

  if (existing) return existing;

  const conversation = {
    id: nextId("conversation"),
    userProfileId,
    title: "新对话",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastTaskAt: null,
  };
  store.generationConversations.unshift(conversation);
  return conversation;
}

export async function listGenerationConversations(userProfileId: string) {
  const store = getStore();

  return store.generationConversations
    .filter((item) => item.userProfileId === userProfileId)
    .sort((a, b) => {
      const aTime = a.lastTaskAt?.getTime() || a.updatedAt.getTime();
      const bTime = b.lastTaskAt?.getTime() || b.updatedAt.getTime();
      return bTime - aTime;
    })
    .map((conversation) => ({
      ...conversation,
      tasks: taskSummaryForConversation(conversation.id).slice(0, 1),
      _count: {
        tasks: taskSummaryForConversation(conversation.id).length,
      },
    }));
}

export async function createGenerationConversation(userProfileId: string, title: string) {
  const store = getStore();
  const conversation = {
    id: nextId("conversation"),
    userProfileId,
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

export async function updateGenerationConversationTitle(userProfileId: string, conversationId: string, title: string) {
  const conversation = getStore().generationConversations.find(
    (item) => item.id === conversationId && item.userProfileId === userProfileId,
  );
  if (!conversation) {
    throw new Error("对话不存在");
  }
  conversation.title = title.trim();
  conversation.updatedAt = new Date();
  return {
    ...conversation,
    tasks: taskSummaryForConversation(conversation.id).slice(0, 1),
    _count: { tasks: taskSummaryForConversation(conversation.id).length },
  };
}

export async function deleteGenerationConversation(userProfileId: string, conversationId: string) {
  const store = getStore();
  const index = store.generationConversations.findIndex(
    (item) => item.id === conversationId && item.userProfileId === userProfileId,
  );
  if (index < 0) {
    throw new Error("对话不存在");
  }
  store.generationConversations.splice(index, 1);
  store.generationTasks = store.generationTasks.filter((task) => task.conversationId !== conversationId);
}

export async function requireOwnedConversation(userProfileId: string, conversationId: string) {
  const conversation = getStore().generationConversations.find(
    (item) => item.id === conversationId && item.userProfileId === userProfileId,
  );
  if (!conversation) {
    throw new Error("对话不存在");
  }
  return conversation;
}
