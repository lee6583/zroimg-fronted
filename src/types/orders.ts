type PaymentType = "alipay" | "wxpay";

type PackageOrderRequest = {
  mode: "package";
  packageId: string;
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
    packageId?: string;
    packageName?: string;
    amountCent?: number;
    amountText?: string;
    credits?: number;
    payStatus?: string;
    creditsStatus?: string;
    displayStatus?: string;
    expireTime?: string | null;
    payUrl?: string | null;
    resultUrl?: string | null;
  };
};

type CancelOrderResponse = {
  ok: boolean;
  orderNo: string;
  status: "cancelled";
};

type CreatePaymentResponse = {
  orderNo: string;
  payChannel: string;
  merchantId: string;
  payUrl: string;
  payStatus: string;
};

type RechargeOrder = {
  orderNo: string;
  packageId: number;
  packageCode: string;
  packageName: string;
  packageDescription?: string | null;
  amountCent: number;
  amountText: string;
  credits: number;
  payChannel?: string | null;
  payChannelText?: string | null;
  payStatus: string;
  creditsStatus: string;
  displayStatus: string;
  thirdTradeNo?: string | null;
  createTime: string;
  payTime?: string | null;
  expireTime?: string | null;
};

type RechargeOverview = {
  pendingOrderCount: number;
  completedOrderCount: number;
  enabledPackageCount: number;
  totalPoints: number;
};

type RechargeOrderPageQuery = {
  userProfileId: string;
  page: number;
  pageSize: number;
};

type RechargeOrderPage = {
  total: number;
  pages: number;
  list: RechargeOrder[];
};

type CreditPackage = {
  id: string;
  code: string;
  name: string;
  description: string;
  amountCent: number;
  amountText: string;
  credits: number;
  highlights: string[];
  recommended: boolean;
  enabled: boolean;
  sort: number;
};

export type {
  PaymentType,
  PackageOrderRequest,
  CustomOrderRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  CancelOrderResponse,
  CreatePaymentResponse,
  RechargeOrder,
  RechargeOverview,
  RechargeOrderPageQuery,
  RechargeOrderPage,
  CreditPackage,
};
