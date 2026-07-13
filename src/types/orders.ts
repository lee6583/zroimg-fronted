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
    payUrl?: string | null;
  };
};

export type {
  PaymentType,
  PackageOrderRequest,
  CustomOrderRequest,
  CreateOrderRequest,
  CreateOrderResponse,
};
