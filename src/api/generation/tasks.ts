import { request } from "@/utils/request";
import type {
  CreateGenerationTaskRequest,
  CreateGenerationTaskResponse,
  FetchGenerationTaskResponse,
  GenerationPriceRequest,
  GenerationPriceResponse,
} from "@/types/generation";

function createTask(data: CreateGenerationTaskRequest) {
  return request<CreateGenerationTaskResponse>({
    url: "/api/generations",
    method: "POST",
    data,
  });
}

function fetchTask(taskId: string) {
  return request<FetchGenerationTaskResponse>({
    url: `/api/generations/${taskId}`,
    method: "GET",
  });
}

function estimatePrice(data: GenerationPriceRequest) {
  return request<GenerationPriceResponse>({
    url: "/api/generations/estimate",
    method: "POST",
    data,
  });
}

export const generationTasksApi = {
  createTask,
  fetchTask,
  estimatePrice,
};
