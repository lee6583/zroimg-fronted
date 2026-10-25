import { request } from "@/utils/request";
import type {
  AdjustPointsRequest,
  AdjustPointsResponse,
  AdminUser,
  UpdateUserPasswordRequest,
  UpdateUserStatusRequest,
} from "@/types/admin";

function updateStatus(userId: string, data: UpdateUserStatusRequest) {
  return request<AdminUser>({
    url: `/api/auth/admin/users/${userId}/status`,
    method: "PATCH",
    data,
  });
}

function updatePassword(userId: string, data: UpdateUserPasswordRequest) {
  return request<Record<string, never>>({
    url: `/api/auth/admin/users/${userId}/password`,
    method: "POST",
    data,
  });
}

function remove(userId: string) {
  return request<Record<string, never>>({
    url: `/api/auth/admin/users/${userId}`,
    method: "DELETE",
  });
}

function adjustPoints(userId: string, data: AdjustPointsRequest) {
  return request<AdjustPointsResponse>({
    url: `/api/points/admin/users/${userId}/adjust`,
    method: "POST",
    data,
  });
}

export const adminUsersApi = {
  updateStatus,
  updatePassword,
  remove,
  adjustPoints,
};
