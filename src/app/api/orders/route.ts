import { getCurrentUserProfile } from "@/server/auth";
import { adjustProfileCredits, getStore, nextId } from "@/server/bff/mock-store";
import { jsonError, jsonOk } from "@/server/http";
import { calculateCustomCredits } from "@/utils/credits";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const payload = (await request.json()) as {
    mode?: "package" | "custom";
    packageCode?: string;
    amountCny?: number;
    paymentType?: "alipay" | "wxpay";
  };

  const store = getStore();
  if (!store.settings.easypay.enabled) {
    return jsonError("支付能力已关闭");
  }

  const paymentType: "alipay" | "wxpay" = payload.paymentType === "wxpay" ? "wxpay" : "alipay";
  let credits = 0;
  let amountCny = 0;
  let creditPackageId: string | null = null;

  if (payload.mode === "custom") {
    amountCny = Number(payload.amountCny || 0);
    if (!Number.isFinite(amountCny) || amountCny <= 0) {
      return jsonError("请输入有效金额");
    }
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
  adjustProfileCredits(current.profile.id, credits, payload.mode === "custom" ? "自定义充值" : `套餐购买 ${payload.packageCode}`, "purchase");

  return jsonOk({
    order: {
      ...order,
      payUrl: order.payUrl,
    },
  });
}
