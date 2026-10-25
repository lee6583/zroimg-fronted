import { request } from "@/utils/request";
import type {
  GenerationConversation,
  GenerationConversationRequest,
  GenerationTask,
} from "@/types/generation";

function fetchConversations() {
  return request<GenerationConversation[]>({
    url: "/api/generation/user/conversations",
    method: "GET",
  });
}

function createConversation(data: GenerationConversationRequest) {
  return request<GenerationConversation>({
    url: "/api/generation/user/conversations",
    method: "POST",
    data,
  });
}

function fetchConversationTasks(conversationId: string) {
  return request<GenerationTask[]>({
    url: `/api/generation/user/conversations/${encodeURIComponent(conversationId)}/tasks`,
    method: "GET",
  });
}

function updateConversation(conversationId: string, data: GenerationConversationRequest) {
  return request<GenerationConversation>({
    url: `/api/generation/user/conversations/${encodeURIComponent(conversationId)}`,
    method: "PATCH",
    data,
  });
}

function deleteConversation(conversationId: string) {
  return request<null>({
    url: `/api/generation/user/conversations/${encodeURIComponent(conversationId)}`,
    method: "DELETE",
  });
}

export const generationConversationsApi = {
  fetchConversations,
  createConversation,
  fetchConversationTasks,
  updateConversation,
  deleteConversation,
};
