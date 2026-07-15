type PaymentType = "alipay" | "wxpay";

type PackageOrderRequest = {
  mode: "package";
  packageCode: string;
  paymentType: PaymentType;
};

type CustomOrderRequest = {
  mode: "custom";
  amountCny: number;
  paymentType: PaymentType;
};

type CreateOrderRequest = PackageOrderRequest | CustomOrderRequest;

type CreateOrderResponse = {
  order?: {
    orderNo?: string;
    payUrl?: string | null;
    resultUrl?: string | null;
  };
};

type CancelOrderResponse = {
  ok: boolean;
  orderNo: string;
  status: "cancelled";
};

export type {
  PaymentType,
  PackageOrderRequest,
  CustomOrderRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  CancelOrderResponse,
};
