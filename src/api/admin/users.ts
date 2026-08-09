import { request } from "@/utils/request";
import type {
  AdjustUserCreditsRequest,
  AdjustUserCreditsResponse,
  ResetUserPasswordRequest,
  ResetUserPasswordResponse,
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

function resetPassword(userId: string, data: ResetUserPasswordRequest) {
  return request<ResetUserPasswordResponse>({
    url: `/api/admin/users/${userId}/password`,
    method: "POST",
    data,
  });
}

export const adminUsersApi = {
  adjustCredits,
  resetPassword,
  updateStatus,
};
