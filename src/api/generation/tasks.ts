import { request } from "@/utils/request";
import type {
  CreateGenerationTaskRequest,
  CreateGenerationTaskResponse,
  FetchGenerationTaskResponse,
  UploadMediaResponse,
} from "@/types/generation";

function uploadMedia(data: FormData) {
  return request<UploadMediaResponse>({
    url: "/api/media/upload",
    method: "POST",
    body: data,
  });
}

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

export const generationTasksApi = {
  uploadMedia,
  createTask,
  fetchTask,
};
