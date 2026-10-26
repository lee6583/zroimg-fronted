import type { PaymentType } from "@/types/orders";

const paymentTypes: readonly string[] = ["alipay", "wxpay"] satisfies PaymentType[];

// Java 返回的 payChannel 是已知渠道时用翻译文案，否则回退到后端的 payChannelText。
export function isPaymentType(value: string | null | undefined): value is PaymentType {
  return typeof value === "string" && paymentTypes.includes(value);
}
