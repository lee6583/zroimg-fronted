import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { getStore, nextId } from "@/server/bff/mock-store";
import { isMockPaymentBffEnabled } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { getJavaApiErrorStatus, requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import { parseJson } from "@/server/validation";
import { getErrorMessage } from "@/utils/error";
import { calculateCustomCredits } from "@/utils/credits";
import { calculateRechargeFeeCent, normalizeRechargeAmountBreakdown } from "@/utils/recharge";

const paymentTypeSchema = z.enum(["alipay", "wxpay"]);

const packageOrderSchema = z.object({
  mode: z.literal("package"),
  packageId: z.string().trim().min(1, "请选择积分套餐").max(64),
  paymentType: paymentTypeSchema,
});

const customOrderSchema = z.object({
  mode: z.literal("custom"),
  amountCny: z.number().positive("购买金额必须大于 0").max(1_000_000, "购买金额过高"),
  paymentType: paymentTypeSchema,
});

const orderSchema = z.discriminatedUnion("mode", [packageOrderSchema, customOrderSchema]);

const javaRechargeOrderSchema = z.object({
  orderNo: z.string(),
  packageId: javaIdSchema,
  packageName: z.string(),
  amountCent: z.number(),
  amountText: z.string(),
  rechargeAmountCent: z.number().nullable().optional(),
  feeAmountCent: z.number().nullable().optional(),
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
  if (!/^\d+$/.test(value) || value === "0") {
    return null;
  }
  return value;
}

function buildResultUrl(orderNo: string) {
  return `/billing/result?order=${encodeURIComponent(orderNo)}`;
}

async function createJavaOrder(payload: z.output<typeof orderSchema>) {
  let requestBody: Record<string, unknown>;

  if (payload.mode === "package") {
    const packageId = normalizePackageId(payload.packageId);
    if (!packageId) {
      return jsonError("套餐 ID 格式不正确");
    }

    requestBody = { packageId, payChannel: payload.paymentType };
  } else {
    const amountCent = Math.round(payload.amountCny * 100);
    requestBody = { amountCent, payChannel: payload.paymentType };
  }

  let data: unknown;
  try {
    data = await requestJavaApiData<unknown>("/order/user/recharge-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getJavaApiErrorStatus(error));
  }

  const parsed = javaRechargeOrderSchema.safeParse(data);

  if (!parsed.success) {
    return jsonError("创建充值订单接口返回格式不正确", 502);
  }

  const order = parsed.data;
  const amountBreakdown = normalizeRechargeAmountBreakdown(order);

  return jsonOk({
    order: {
      orderNo: order.orderNo,
      packageId: order.packageId,
      packageName: order.packageName,
      amountCent: order.amountCent,
      amountText: order.amountText,
      rechargeAmountCent: amountBreakdown.rechargeAmountCent,
      feeAmountCent: amountBreakdown.feeAmountCent,
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

  const now = new Date();
  const pendingOrderCount = store.paymentOrders.filter((order) => {
    const isOwner = order.userProfileId === userProfileId;
    const isPending = order.status === "pending";
    const isActive = !order.expiresAt || order.expiresAt > now;

    return isOwner && isPending && isActive;
  }).length;
  if (pendingOrderCount >= store.settings.easypay.maxPendingOrders) {
    return jsonError("待支付订单已达上限，请先完成支付或等待订单关闭", 409);
  }

  const paymentType = payload.paymentType;
  const orderNo = `MOCK${Date.now()}`;
  let credits = 0;
  let amountCny = 0;
  let creditPackageId: string | null = null;

  if (payload.mode === "custom") {
    const amountCent = Math.round(payload.amountCny * 100);
    const settings = store.settings.easypay;
    if (amountCent < settings.minAmountCent || amountCent > settings.maxAmountCent) {
      return jsonError(
        `充值金额需在 ¥${(settings.minAmountCent / 100).toFixed(2)} 至 ¥${(
          settings.maxAmountCent / 100
        ).toFixed(2)} 之间`,
      );
    }
    amountCny = amountCent / 100;
    credits = calculateCustomCredits(amountCny, settings.creditsPerYuan);
  } else {
    const creditPackage = store.creditPackages.find((item) => item.id === payload.packageId);
    if (!creditPackage) {
      return jsonError("套餐不存在");
    }

    credits = creditPackage.credits;
    amountCny = creditPackage.priceCny;
    creditPackageId = creditPackage.id;
  }

  const rechargeAmountCent = Math.round(amountCny * 100);
  const settings = store.settings.easypay;
  if (rechargeAmountCent < settings.minAmountCent || rechargeAmountCent > settings.maxAmountCent) {
    return jsonError(
      `充值金额需在 ¥${(settings.minAmountCent / 100).toFixed(2)} 至 ¥${(
        settings.maxAmountCent / 100
      ).toFixed(2)} 之间`,
    );
  }
  const feeAmountCent = calculateRechargeFeeCent(rechargeAmountCent, settings.feeRatePercent);
  const amountCent = rechargeAmountCent + feeAmountCent;
  amountCny = amountCent / 100;

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
    rechargeAmountCny: rechargeAmountCent / 100,
    feeAmountCny: feeAmountCent / 100,
    creditPackageId,
    providerTradeNo: null,
    payUrl,
    createdAt: new Date(),
    paidAt: null,
    expiresAt: new Date(now.getTime() + settings.timeoutMinutes * 60_000),
  };

  store.paymentOrders.unshift(order);

  return jsonOk({
    order: {
      ...order,
      amountCent,
      amountText: `¥${amountCny.toFixed(2)}`,
      rechargeAmountCent,
      feeAmountCent,
      expireTime: order.expiresAt.toISOString(),
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

  if (isMockPaymentBffEnabled()) {
    return createMockOrder(payload, current.profile.id);
  }

  return createJavaOrder(payload);
}
