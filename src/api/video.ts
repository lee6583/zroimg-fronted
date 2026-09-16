import { request } from "@/utils/request";
import type {
  CreateVideoTaskRequest,
  CreateVideoTaskResponse,
  VideoModelResponse,
  VideoPriceRequest,
  VideoPriceResponse,
  VideoTaskPageQuery,
  VideoTaskPageResponse,
  VideoTaskResponse,
} from "@/types/video";

function listModels() {
  return request<VideoModelResponse>({ url: "/api/video/models" });
}

function estimate(data: VideoPriceRequest) {
  return request<VideoPriceResponse>({
    url: "/api/video/price/estimate",
    method: "POST",
    data,
  });
}

function createTask(data: CreateVideoTaskRequest) {
  return request<CreateVideoTaskResponse>({
    url: "/api/video/tasks",
    method: "POST",
    data,
  });
}

function listTasks(query: VideoTaskPageQuery) {
  return request<VideoTaskPageResponse>({
    url: "/api/video/tasks",
    params: query,
  });
}

function getTask(taskNo: string) {
  const safeTaskNo = encodeURIComponent(taskNo);
  return request<VideoTaskResponse>({
    url: `/api/video/tasks/${safeTaskNo}`,
  });
}

export const videoApi = {
  createTask,
  estimate,
  getTask,
  listModels,
  listTasks,
};
