import { request } from "@/utils/request";

export function createOrder(data:
  | { mode: "package"; packageCode: string; paymentType: "alipay" | "wxpay" }
  | { mode: "custom"; amountCny: number; paymentType: "alipay" | "wxpay" }) {
  return request<{ order?: { payUrl?: string | null } }>({
    url: "/api/orders",
    method: "POST",
    data,
  });
}
