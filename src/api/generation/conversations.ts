import { request } from "@/utils/request";
import type {
  CreateGenerationConversationRequest,
  CreateGenerationConversationResponse,
  DeleteGenerationConversationResponse,
  FetchConversationTasksResponse,
  FetchGenerationConversationsResponse,
  UpdateGenerationConversationRequest,
  UpdateGenerationConversationResponse,
} from "@/types/generation";

function fetchConversations() {
  return request<FetchGenerationConversationsResponse>({
    url: "/api/generation-conversations",
    method: "GET",
  });
}

function createConversation(data?: CreateGenerationConversationRequest) {
  return request<CreateGenerationConversationResponse>({
    url: "/api/generation-conversations",
    method: "POST",
    data,
  });
}

function fetchConversationTasks(conversationId: string) {
  return request<FetchConversationTasksResponse>({
    url: `/api/generation-conversations/${conversationId}/tasks`,
    method: "GET",
  });
}

function updateConversation(
  conversationId: string,
  data: UpdateGenerationConversationRequest,
) {
  return request<UpdateGenerationConversationResponse>({
    url: `/api/generation-conversations/${conversationId}`,
    method: "PATCH",
    data,
  });
}

function deleteConversation(conversationId: string) {
  return request<DeleteGenerationConversationResponse>({
    url: `/api/generation-conversations/${conversationId}`,
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
