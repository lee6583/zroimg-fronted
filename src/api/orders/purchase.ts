import { request } from "@/utils/request";
import type {
  CreatePaymentResponse,
  CreateRechargeOrderRequest,
  CreatedRechargeOrder,
  RechargeOrder,
} from "@/types/orders";

const baseUrl = "/api/order/user/recharge-orders";

function create(data: CreateRechargeOrderRequest) {
  return request<CreatedRechargeOrder>({
    url: baseUrl,
    method: "POST",
    data,
  });
}

function cancel(orderNo: string) {
  return request<RechargeOrder>({
    url: `${baseUrl}/${encodeURIComponent(orderNo)}/cancel`,
    method: "POST",
  });
}

function pay(orderNo: string) {
  return request<CreatePaymentResponse>({
    url: `${baseUrl}/${encodeURIComponent(orderNo)}/pay`,
    method: "POST",
  });
}

export const ordersApi = {
  cancel,
  create,
  pay,
};
