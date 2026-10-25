import { request } from "@/utils/request";
import type {
  CreateVideoTaskRequest,
  VideoModel,
  VideoPriceEstimate,
  VideoPriceEstimateRequest,
  VideoTask,
  VideoTaskPage,
  VideoTaskPageQuery,
} from "@/types/video";

function listModels() {
  return request<VideoModel[]>({ url: "/api/generation/user/video/models" });
}

function estimate(data: VideoPriceEstimateRequest) {
  return request<VideoPriceEstimate>({
    url: "/api/generation/user/video/price/estimate",
    method: "POST",
    data,
  });
}

function createTask(data: CreateVideoTaskRequest) {
  return request<VideoTask>({
    url: "/api/generation/user/video/tasks",
    method: "POST",
    data,
  });
}

function listTasks(query: VideoTaskPageQuery) {
  return request<VideoTaskPage>({
    url: "/api/generation/user/video/tasks",
    params: query,
  });
}

function getTask(taskNo: string) {
  return request<VideoTask>({
    url: `/api/generation/user/video/tasks/${encodeURIComponent(taskNo)}`,
  });
}

export const videoApi = {
  createTask,
  estimate,
  getTask,
  listModels,
  listTasks,
};
