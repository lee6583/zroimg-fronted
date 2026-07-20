import { getCurrentUserProfile } from "@/server/auth";
import { getStore } from "@/server/bff/mock-store";
import { handleApi, jsonError, jsonOk } from "@/server/http";

export async function POST(_request: Request, context: { params: Promise<{ orderNo: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const { orderNo } = await context.params;
    const store = getStore();
    const order = store.paymentOrders.find((item) => {
      const isOwner = item.userProfileId === current.profile.id;
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
  });
}
