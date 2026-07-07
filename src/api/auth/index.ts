import { request } from "@/utils/request";

export function getSliderToken(data: { email: string; scene?: string }) {
  return request<{ token?: string; sliderToken?: string }>({
    url: "/api/auth/slider-token",
    method: "POST",
    data,
  });
}

export function sendRegisterCode(data: { email: string; sliderToken: string }) {
  return request<{ message?: string; code?: string; cooldownSeconds?: number; expiresInSeconds?: number }>({
    url: "/api/auth/send-code",
    method: "POST",
    data,
  });
}

export function registerAccount(data: {
  username: string;
  email: string;
  password: string;
  code: string;
}) {
  return request<{ ok?: boolean; message?: string }>({
    url: "/api/auth/register",
    method: "POST",
    data,
  });
}

export function loginWithEmail(data: { email: string; password: string; sliderToken: string }) {
  return request<{ ok?: boolean }>({
    url: "/api/auth/sign-in/email",
    method: "POST",
    data,
  });
}
