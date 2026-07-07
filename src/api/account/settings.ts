import { request } from "@/utils/request";

export function updateAccountProfile(data: FormData) {
  return request<{ ok?: boolean }>({
    url: "/api/account/profile",
    method: "POST",
    body: data,
  });
}

export function updateAccountPassword(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return request<{ ok?: boolean }>({
    url: "/api/account/password",
    method: "POST",
    data,
  });
}
