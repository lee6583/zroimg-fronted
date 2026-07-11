import { request } from "@/utils/request";
import type {
  AdjustUserCreditsRequest,
  AdjustUserCreditsResponse,
  UpdateUserStatusRequest,
  UpdateUserStatusResponse,
} from "@/types/admin";

function adjustCredits(userId: string, data: AdjustUserCreditsRequest) {
  return request<AdjustUserCreditsResponse>({
    url: `/api/admin/users/${userId}/credits`,
    method: "POST",
    data,
  });
}

function updateStatus(userId: string, data: UpdateUserStatusRequest) {
  return request<UpdateUserStatusResponse>({
    url: `/api/admin/users/${userId}/status`,
    method: "POST",
    data,
  });
}

export const adminUsersApi = {
  adjustCredits,
  updateStatus,
};
