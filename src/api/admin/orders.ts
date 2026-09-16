import { request } from "@/utils/request";
import type { ReissueCreditsResponse } from "@/types/orders";

function reissueCredits(orderNo: string) {
  return request<ReissueCreditsResponse>({
    url: `/api/admin/orders/${orderNo}/reissue`,
    method: "POST",
  });
}

export const adminOrdersApi = {
  reissueCredits,
};
