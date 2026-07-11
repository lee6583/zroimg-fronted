import { request } from "@/utils/request";
import type { CreateOrderRequest, CreateOrderResponse } from "@/types/orders";

function createOrder(data: CreateOrderRequest) {
  return request<CreateOrderResponse>({
    url: "/api/orders",
    method: "POST",
    data,
  });
}

export const ordersApi = {
  createOrder,
};
