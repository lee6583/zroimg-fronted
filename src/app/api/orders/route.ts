import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { adjustProfileCredits, getStore, nextId } from "@/server/bff/mock-store";
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

  const paymentType = payload.paymentType;
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

  const orderNo = `MOCK${Date.now()}`;
  const order = {
    id: nextId("order"),
    userProfileId: current.profile.id,
    orderNo,
    paymentType,
    status: "fulfilled" as const,
    credits,
    amountCny,
    creditPackageId,
    providerTradeNo: `TRADE-${Date.now()}`,
    payUrl: `/billing/result?order=${orderNo}`,
    createdAt: new Date(),
    paidAt: new Date(),
  };

  store.paymentOrders.unshift(order);
  adjustProfileCredits(
    current.profile.id,
    credits,
    payload.mode === "custom" ? "自定义充值" : `套餐购买 ${payload.packageCode}`,
    "purchase",
  );

  return jsonOk({
    order: {
      ...order,
      payUrl: order.payUrl,
    },
  });
}
