import { request } from "@/utils/request";
import type { AdminRechargeOrder } from "@/types/admin";

function reissueCredits(orderNo: string) {
  return request<AdminRechargeOrder>({
    url: `/api/order/admin/recharge-orders/${encodeURIComponent(orderNo)}/reissue-credits`,
    method: "POST",
  });
}

export const adminOrdersApi = {
  reissueCredits,
};
