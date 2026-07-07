import { request } from "@/utils/request";
import type {
  GenerationTaskApiItem,
  UploadedMediaApiItem,
} from "@/types/generation";

export type { GenerationTaskApiItem, UploadedMediaApiItem };

export function uploadInputMedia(data: FormData) {
  return request<{ media: UploadedMediaApiItem }>({
    url: "/api/media/upload",
    method: "POST",
    body: data,
  });
}

export function createGenerationTask(data: unknown) {
  return request<{ task: GenerationTaskApiItem }>({
    url: "/api/generations",
    method: "POST",
    data,
  });
}

export function fetchGenerationTask(taskId: string) {
  return request<{ task: GenerationTaskApiItem }>({
    url: `/api/generations/${taskId}`,
    method: "GET",
  });
}
