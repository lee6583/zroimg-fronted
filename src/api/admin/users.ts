import { request } from "@/utils/request";

export function adjustUserCredits(userId: string, data: { amount: number; reason: string }) {
  return request<{ ok?: boolean }>({
    url: `/api/admin/users/${userId}/credits`,
    method: "POST",
    data,
  });
}

export function updateUserStatus(userId: string, data: { status: "active" | "banned" }) {
  return request<{ ok?: boolean }>({
    url: `/api/admin/users/${userId}/status`,
    method: "POST",
    data,
  });
}
