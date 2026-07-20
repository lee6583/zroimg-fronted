import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { getStore, nextId } from "@/server/bff/mock-store";
import { isMockBffEnabled } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { requestJavaApiData } from "@/server/java-api";
import { parseJson } from "@/server/validation";
import { getErrorMessage } from "@/utils/error";
import {
  calculateCustomCredits,
  CUSTOM_MAX_AMOUNT_CNY,
  CUSTOM_MIN_AMOUNT_CNY,
} from "@/utils/credits";

const paymentTypeSchema = z.enum(["alipay", "wxpay"]);

const packageOrderSchema = z.object({
  mode: z.literal("package"),
  packageId: z.string().trim().min(1, "请选择积分套餐").max(64),
  paymentType: paymentTypeSchema,
});

const customOrderSchema = z.object({
  mode: z.literal("custom"),
  amountCny: z
    .number()
    .min(CUSTOM_MIN_AMOUNT_CNY, "购买金额过低")
    .max(CUSTOM_MAX_AMOUNT_CNY, "购买金额过高"),
  paymentType: paymentTypeSchema,
});

const orderSchema = z.discriminatedUnion("mode", [packageOrderSchema, customOrderSchema]);

const javaRechargeOrderSchema = z.object({
  orderNo: z.string(),
  packageId: z.number(),
  packageName: z.string(),
  amountCent: z.number(),
  amountText: z.string(),
  credits: z.number(),
  payStatus: z.string(),
  creditsStatus: z.string(),
  displayStatus: z.string(),
  expireTime: z.string().nullable().optional(),
});

function buildPayUrl(input: {
  amountCny: number;
  orderNo: string;
  paymentType: string;
  settings: ReturnType<typeof getStore>["settings"]["easypay"];
}) {
  const apiBase = input.settings.apiBase?.trim();
  if (!apiBase) {
    return null;
  }

  let payUrl: URL;
  try {
    payUrl = new URL("/checkout", apiBase);
  } catch {
    return null;
  }

  payUrl.searchParams.set("type", input.paymentType);
  payUrl.searchParams.set("orderNo", input.orderNo);
  payUrl.searchParams.set("amount", input.amountCny.toFixed(2));
  payUrl.searchParams.set("returnUrl", input.settings.returnUrl);
  return payUrl.toString();
}

function normalizePackageId(value: string) {
  const packageId = Number(value);

  if (!Number.isInteger(packageId) || packageId <= 0) {
    return null;
  }

  return packageId;
}

function buildResultUrl(orderNo: string) {
  return `/billing/result?order=${encodeURIComponent(orderNo)}`;
}

async function createJavaPackageOrder(payload: z.output<typeof packageOrderSchema>) {
  const packageId = normalizePackageId(payload.packageId);
  if (!packageId) {
    return jsonError("套餐 ID 格式不正确");
  }

  let data: unknown;
  try {
    data = await requestJavaApiData<unknown>("/order/user/recharge-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ packageId }),
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 502);
  }

  const parsed = javaRechargeOrderSchema.safeParse(data);

  if (!parsed.success) {
    return jsonError("创建充值订单接口返回格式不正确", 502);
  }

  const order = parsed.data;

  return jsonOk({
    order: {
      orderNo: order.orderNo,
      packageId: String(order.packageId),
      packageName: order.packageName,
      amountCent: order.amountCent,
      amountText: order.amountText,
      credits: order.credits,
      payStatus: order.payStatus,
      creditsStatus: order.creditsStatus,
      displayStatus: order.displayStatus,
      expireTime: order.expireTime ?? null,
      payUrl: null,
      resultUrl: buildResultUrl(order.orderNo),
    },
  });
}

async function createMockOrder(payload: z.output<typeof orderSchema>, userProfileId: string) {
  const store = getStore();
  if (!store.settings.easypay.enabled) {
    return jsonError("支付能力已关闭");
  }

  const pendingOrder = store.paymentOrders.find((order) => {
    const isOwner = order.userProfileId === userProfileId;
    const isPending = order.status === "pending";

    return isOwner && isPending;
  });
  if (pendingOrder) {
    return jsonError("已有待支付订单，请先完成支付或取消订单", 409);
  }

  const paymentType = payload.paymentType;
  const orderNo = `MOCK${Date.now()}`;
  let credits = 0;
  let amountCny = 0;
  let creditPackageId: string | null = null;

  if (payload.mode === "custom") {
    amountCny = payload.amountCny;
    credits = calculateCustomCredits(amountCny);
  } else {
    const creditPackage = store.creditPackages.find((item) => item.id === payload.packageId);
    if (!creditPackage) {
      return jsonError("套餐不存在");
    }

    credits = creditPackage.credits;
    amountCny = creditPackage.priceCny;
    creditPackageId = creditPackage.id;
  }

  const payUrl = buildPayUrl({
    amountCny,
    orderNo,
    paymentType,
    settings: store.settings.easypay,
  });
  const resultUrl = buildResultUrl(orderNo);
  const order = {
    id: nextId("order"),
    userProfileId,
    orderNo,
    paymentType,
    status: "pending" as const,
    credits,
    amountCny,
    creditPackageId,
    providerTradeNo: null,
    payUrl,
    createdAt: new Date(),
    paidAt: null,
  };

  store.paymentOrders.unshift(order);

  return jsonOk({
    order: {
      ...order,
      resultUrl,
    },
  });
}

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const parsed = await parseJson(request, orderSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const payload = parsed.data;

  if (isMockBffEnabled()) {
    return createMockOrder(payload, current.profile.id);
  }

  if (payload.mode === "custom") {
    return jsonError("后端暂未支持自定义金额购买", 400);
  }

  return createJavaPackageOrder(payload);
}
