import { request } from "@/utils/request";
import type {
  CreateGenerationTaskRequest,
  GenerationModel,
  GenerationPriceEstimate,
  GenerationPriceEstimateRequest,
  GenerationTask,
  GenerationTaskQuery,
} from "@/types/generation";
import type { PageResult } from "@/types/api";

function fetchModels(params?: { modelType?: string; mode?: string }) {
  return request<GenerationModel[]>({
    url: "/api/generation/user/models",
    method: "GET",
    params,
  });
}

function estimatePrice(data: GenerationPriceEstimateRequest) {
  return request<GenerationPriceEstimate>({
    url: "/api/generation/user/price/estimate",
    method: "POST",
    data,
  });
}

function createTask(data: CreateGenerationTaskRequest) {
  return request<GenerationTask>({
    url: "/api/generation/user/tasks",
    method: "POST",
    data,
  });
}

function fetchTasks(params: GenerationTaskQuery) {
  return request<PageResult<GenerationTask>>({
    url: "/api/generation/user/tasks",
    method: "GET",
    params,
  });
}

function fetchTask(taskNo: string) {
  return request<GenerationTask>({
    url: `/api/generation/user/tasks/${encodeURIComponent(taskNo)}`,
    method: "GET",
  });
}

export const generationTasksApi = {
  fetchModels,
  estimatePrice,
  createTask,
  fetchTasks,
  fetchTask,
};
