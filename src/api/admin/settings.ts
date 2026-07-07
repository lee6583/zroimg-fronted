import { request } from "@/utils/request";

export function saveGenerationSettings(data: {
  enabled: boolean;
  baseUrl: string;
  model: string;
  apiKey: string;
  clearApiKey: boolean;
}) {
  return request<{ settings: unknown }>({
    url: "/api/admin/settings/generation",
    method: "POST",
    data,
  });
}

export function saveSmtpSettings(data: {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  clearPassword: boolean;
  from: string;
}) {
  return request<{ settings: unknown }>({
    url: "/api/admin/settings/mail",
    method: "POST",
    data,
  });
}

export function testSmtpSettings(data: { mode: "connection" | "email"; email?: string }) {
  return request<{ ok?: boolean }>({
    url: "/api/admin/settings/mail/test",
    method: "POST",
    data,
  });
}

export function saveEasyPaySettings(data: {
  enabled: boolean;
  apiBase: string;
  pid: string;
  key: string;
  clearKey: boolean;
  notifyUrl: string;
  returnUrl: string;
}) {
  return request<{ settings: unknown }>({
    url: "/api/admin/settings/payment/easypay",
    method: "POST",
    data,
  });
}

export function saveCheckInSettings(data: { dailyCredits: number }) {
  return request<{ settings: { dailyCredits: number } }>({
    url: "/api/admin/settings/checkin",
    method: "POST",
    data,
  });
}
