import { getCurrentUserProfile } from "@/server/auth";
import { detectJavaRechargeOrder } from "@/server/bff/orders";
import { getStore } from "@/server/bff/mock-store";
import { isMockBffEnabled } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { getErrorMessage } from "@/utils/error";

function formatAmountText(amountCny: number) {
  return `¥${amountCny.toFixed(2).replace(/\.00$/, "")}`;
}

async function detectMockOrder(orderNo: string, userProfileId: string) {
  const store = getStore();
  const order = store.paymentOrders.find((item) => {
    const isOwner = item.userProfileId === userProfileId;
    const isCurrentOrder = item.orderNo === orderNo;

    return isOwner && isCurrentOrder;
  });

  if (!order) {
    return jsonError("订单不存在", 404);
  }

  const creditPackage = store.creditPackages.find((item) => item.id === order.creditPackageId);

  return jsonOk({
    orderNo: order.orderNo,
    packageId: Number(order.creditPackageId ?? 0),
    packageCode: creditPackage?.code ?? "CUSTOM",
    packageName: creditPackage?.name ?? "自定义积分购买",
    packageDescription: null,
    amountCent: Math.round(order.amountCny * 100),
    amountText: formatAmountText(order.amountCny),
    credits: order.credits,
    payChannel: order.paymentType,
    payChannelText: order.paymentType,
    payStatus: order.status,
    creditsStatus: order.status === "fulfilled" ? "fulfilled" : "pending",
    displayStatus: order.status,
    thirdTradeNo: order.providerTradeNo,
    createTime: order.createdAt.toISOString(),
    payTime: order.paidAt?.toISOString() ?? null,
    expireTime: null,
  });
}

async function detectJavaOrder(orderNo: string) {
  try {
    const order = await detectJavaRechargeOrder(orderNo);
    return jsonOk(order);
  } catch (error) {
    return jsonError(getErrorMessage(error), 502);
  }
}

export async function POST(_request: Request, context: { params: Promise<{ orderNo: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { orderNo } = await context.params;
  if (!orderNo) {
    return jsonError("订单号不能为空");
  }

  if (isMockBffEnabled()) {
    return detectMockOrder(orderNo, current.profile.id);
  }

  return detectJavaOrder(orderNo);
}
