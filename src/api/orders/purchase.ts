import { request } from "@/utils/request";
import type { CancelOrderResponse, CreateOrderRequest, CreateOrderResponse } from "@/types/orders";

function createOrder(data: CreateOrderRequest) {
  return request<CreateOrderResponse>({
    url: "/api/orders",
    method: "POST",
    data,
  });
}

function cancelOrder(orderNo: string) {
  return request<CancelOrderResponse>({
    url: `/api/orders/${orderNo}/cancel`,
    method: "POST",
  });
}

export const ordersApi = {
  cancelOrder,
  createOrder,
};
