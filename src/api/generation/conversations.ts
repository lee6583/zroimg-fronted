import { request } from "@/utils/request";
import type {
  GenerationConversationApiItem,
  GenerationTaskApiItem,
} from "@/types/generation";

export type { GenerationConversationApiItem, GenerationTaskApiItem };

export function fetchGenerationConversations() {
  return request<{ conversations?: GenerationConversationApiItem[] } | GenerationConversationApiItem[]>({
    url: "/api/generation-conversations",
    method: "GET",
  });
}

export function createGenerationConversation(data?: { title?: string }) {
  return request<{ conversation?: GenerationConversationApiItem }>({
    url: "/api/generation-conversations",
    method: "POST",
    data,
  });
}

export function fetchConversationTasks(conversationId: string) {
  return request<{ tasks?: GenerationTaskApiItem[] } | GenerationTaskApiItem[]>({
    url: `/api/generation-conversations/${conversationId}/tasks`,
    method: "GET",
  });
}

export function updateGenerationConversation(conversationId: string, data: { title: string }) {
  return request<{ conversation?: GenerationConversationApiItem }>({
    url: `/api/generation-conversations/${conversationId}`,
    method: "PATCH",
    data,
  });
}

export function deleteGenerationConversation(conversationId: string) {
  return request<{ ok?: boolean }>({
    url: `/api/generation-conversations/${conversationId}`,
    method: "DELETE",
  });
}
