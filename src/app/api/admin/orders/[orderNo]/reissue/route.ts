import { getCurrentUserProfile } from "@/server/auth";
import { reissueJavaRechargeCredits } from "@/server/bff/orders";
import { isMockPaymentBffEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { getJavaApiErrorStatus } from "@/server/java-api";
import { getErrorMessage } from "@/utils/error";

export async function POST(_request: Request, context: { params: Promise<{ orderNo: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { orderNo } = await context.params;
    if (!orderNo) {
      return jsonError("订单号不能为空");
    }

    if (isMockPaymentBffEnabled()) {
      return jsonError("mock 模式不支持补发积分", 400);
    }

    let order;
    try {
      order = await reissueJavaRechargeCredits(orderNo);
    } catch (error) {
      return jsonError(getErrorMessage(error), getJavaApiErrorStatus(error));
    }

    return jsonOk({
      ok: true,
      orderNo: order.orderNo,
      creditsStatus: order.creditsStatus,
    });
  });
}
