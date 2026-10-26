import { request } from "@/utils/request";
import type { AdminTaskAttempt } from "@/types/admin";

function fetchAttempts(taskNo: string) {
  return request<AdminTaskAttempt[]>({
    url: `/api/generation/admin/tasks/${encodeURIComponent(taskNo)}/attempts`,
    method: "GET",
  });
}

export const adminTasksApi = {
  fetchAttempts,
};
