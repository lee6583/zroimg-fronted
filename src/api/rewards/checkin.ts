import { request } from "@/utils/request";
import type { SignResult } from "@/types/checkin";

function claim() {
  return request<SignResult>({
    url: "/api/points/user/sign",
    method: "POST",
  });
}

export const checkInApi = {
  claim,
};
