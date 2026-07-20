import { request } from "@/utils/request";
import type {
  CancelOrderResponse,
  CreateOrderRequest,
  CreateOrderResponse,
  CreatePaymentResponse,
  RechargeOrder,
} from "@/types/orders";

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

function createPayment(orderNo: string) {
  return request<CreatePaymentResponse>({
    url: `/api/orders/${orderNo}/pay`,
    method: "POST",
  });
}

function detectPayment(orderNo: string) {
  return request<RechargeOrder>({
    url: `/api/orders/${orderNo}/detect`,
    method: "POST",
  });
}

function getOrder(orderNo: string) {
  return request<RechargeOrder>({
    url: `/api/orders/${orderNo}`,
  });
}

export const ordersApi = {
  cancelOrder,
  createOrder,
  createPayment,
  detectPayment,
  getOrder,
};
