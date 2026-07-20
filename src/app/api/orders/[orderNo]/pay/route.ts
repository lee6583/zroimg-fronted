import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { getStore } from "@/server/bff/mock-store";
import { isMockBffEnabled } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { requestJavaApiData } from "@/server/java-api";
import { getErrorMessage } from "@/utils/error";

const javaPaySchema = z.object({
  orderNo: z.string(),
  payChannel: z.string(),
  merchantId: z.string(),
  payUrl: z.string(),
  payStatus: z.string(),
});

function buildJavaPayPath(orderNo: string) {
  const safeOrderNo = encodeURIComponent(orderNo);
  return `/order/user/recharge-orders/${safeOrderNo}/pay`;
}

async function createMockPay(orderNo: string, userProfileId: string) {
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
    return jsonError("只有待支付订单可以发起支付", 409);
  }

  if (!order.payUrl) {
    return jsonError("支付地址为空，请检查支付配置", 409);
  }

  return jsonOk({
    orderNo: order.orderNo,
    payChannel: order.paymentType,
    merchantId: "mock",
    payUrl: order.payUrl,
    payStatus: order.status,
  });
}

async function createJavaPay(orderNo: string) {
  let data: unknown;

  try {
    data = await requestJavaApiData<unknown>(buildJavaPayPath(orderNo), {
      method: "POST",
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), 502);
  }

  const parsed = javaPaySchema.safeParse(data);
  if (!parsed.success) {
    return jsonError("发起支付接口返回格式不正确", 502);
  }

  return jsonOk(parsed.data);
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
    return createMockPay(orderNo, current.profile.id);
  }

  return createJavaPay(orderNo);
}
