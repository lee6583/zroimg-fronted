export type PaymentType = "alipay" | "wxpay";

export type CreateOrderRequest =
  | {
      mode: "package";
      packageCode: string;
      paymentType: PaymentType;
    }
  | {
      mode: "custom";
      amountCny: number;
      paymentType: PaymentType;
    };

export type CreateOrderResponse = {
  order?: {
    payUrl?: string | null;
  };
};
