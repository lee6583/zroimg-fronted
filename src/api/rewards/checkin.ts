import { request } from "@/utils/request";
import type { ClaimCheckInResponse } from "@/types/checkin";

function claim() {
  return request<ClaimCheckInResponse>({
    url: "/api/checkins",
    method: "POST",
  });
}

export const checkInApi = {
  claim,
};
