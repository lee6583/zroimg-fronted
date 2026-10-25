type PaymentType = "alipay" | "wxpay";

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

type RechargeRules = {
  feeRatePercent: number;
  timeoutMinutes: number;
  creditsPerYuan: number;
  maxPendingOrders: number;
  minAmountCent: number;
  maxAmountCent: number;
};

type RechargeOrder = {
  orderNo: string;
  packageId: string;
  packageCode: string;
  packageName: string;
  packageDescription: string | null;
  amountCent: number;
  amountText: string;
  rechargeAmountCent: number;
  feeAmountCent: number;
  credits: number;
  payChannel: string | null;
  payChannelText: string | null;
  payStatus: string;
  creditsStatus: string;
  displayStatus: string;
  thirdTradeNo: string | null;
  createTime: string;
  payTime: string | null;
  expireTime: string | null;
};

type RechargeOverview = {
  pendingOrderCount: number;
  completedOrderCount: number;
  enabledPackageCount: number;
  totalPoints: number;
  rechargeRules: RechargeRules;
};

type CreateRechargeOrderRequest = {
  packageId?: string;
  amountCent?: number;
  payChannel: PaymentType;
};

type CreatePaymentResponse = {
  orderNo: string;
  payChannel: string;
  merchantId: string;
  payUrl: string;
  payStatus: string;
};

type CreatedRechargeOrder = {
  orderNo: string;
  packageId: string;
  packageName: string;
  amountCent: number;
  amountText: string;
  rechargeAmountCent: number;
  feeAmountCent: number;
  credits: number;
  payStatus: string;
  creditsStatus: string;
  displayStatus: string;
  expireTime: string | null;
};

export type {
  PaymentType,
  CreditPackage,
  RechargeRules,
  RechargeOrder,
  RechargeOverview,
  CreateRechargeOrderRequest,
  CreatedRechargeOrder,
  CreatePaymentResponse,
};
