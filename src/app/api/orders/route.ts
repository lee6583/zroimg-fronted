import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { getStore, nextId } from "@/server/bff/mock-store";
import { jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";
import {
  calculateCustomCredits,
  CUSTOM_MAX_AMOUNT_CNY,
  CUSTOM_MIN_AMOUNT_CNY,
} from "@/utils/credits";

const paymentTypeSchema = z.enum(["alipay", "wxpay"]);

const packageOrderSchema = z.object({
  mode: z.literal("package"),
  packageCode: z.string().trim().min(1, "请选择积分套餐").max(64),
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

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const parsed = await parseJson(request, orderSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const payload = parsed.data;

  const store = getStore();
  if (!store.settings.easypay.enabled) {
    return jsonError("支付能力已关闭");
  }

  const pendingOrder = store.paymentOrders.find((order) => {
    const isOwner = order.userProfileId === current.profile.id;
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
    const creditPackage = store.creditPackages.find((item) => item.code === payload.packageCode);
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
  const resultUrl = `/billing/result?order=${orderNo}`;
  const order = {
    id: nextId("order"),
    userProfileId: current.profile.id,
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
