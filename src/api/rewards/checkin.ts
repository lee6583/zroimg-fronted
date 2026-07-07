import { request } from "@/utils/request";

export function claimCheckIn() {
  return request<{ checkIn: unknown }>({
    url: "/api/checkins",
    method: "POST",
  });
}
