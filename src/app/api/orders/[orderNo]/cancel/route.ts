import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { getStore } from "@/server/bff/mock-store";
import { isMockPaymentBffEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { getJavaApiErrorStatus, requestJavaApiData } from "@/server/java-api";
import { getErrorMessage } from "@/utils/error";

const javaCancelOrderSchema = z.object({
  orderNo: z.string(),
  payStatus: z.string(),
});

function buildJavaCancelPath(orderNo: string) {
  const safeOrderNo = encodeURIComponent(orderNo);
  return `/order/user/recharge-orders/${safeOrderNo}/cancel`;
}

function cancelMockOrder(orderNo: string, userProfileId: string) {
  const store = getStore();
  const order = store.paymentOrders.find((item) => {
    const isOwner = item.userProfileId === userProfileId;
    const isCurrentOrder = item.orderNo === orderNo;

    return isOwner && isCurrentOrder;
  });

  if (!order) {
    return jsonError("订单不存在", 404);
  }

  if (order.status !== "pending") {
    return jsonError("只有待支付订单可以取消", 409);
  }

  order.status = "cancelled";
  order.payUrl = null;

  return jsonOk({
    ok: true,
    orderNo: order.orderNo,
    status: order.status,
  });
}

async function cancelJavaOrder(orderNo: string) {
  let data: unknown;

  try {
    data = await requestJavaApiData<unknown>(buildJavaCancelPath(orderNo), {
      method: "POST",
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getJavaApiErrorStatus(error));
  }

  const parsed = javaCancelOrderSchema.safeParse(data);
  if (!parsed.success) {
    return jsonError("取消订单接口返回格式不正确", 502);
  }

  return jsonOk({
    ok: true,
    orderNo: parsed.data.orderNo,
    status: "cancelled",
  });
}

export async function POST(_request: Request, context: { params: Promise<{ orderNo: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const { orderNo } = await context.params;
    if (!orderNo) {
      return jsonError("订单号不能为空");
    }

    if (isMockPaymentBffEnabled()) {
      return cancelMockOrder(orderNo, current.profile.id);
    }

    return cancelJavaOrder(orderNo);
  });
}
