type OrderDisplayStatus = "pending" | "paid" | "cancelled";

const orderDisplayStatusLabels: Record<OrderDisplayStatus, string> = {
  pending: "待支付",
  paid: "已支付",
  cancelled: "已取消",
};

function normalizeOrderDisplayStatus(status: string): OrderDisplayStatus {
  if (
    status === "paid" ||
    status === "fulfilled" ||
    status === "credited" ||
    status === "success"
  ) {
    return "paid";
  }

  if (
    status === "cancelled" ||
    status === "closed" ||
    status === "failed" ||
    status === "expired"
  ) {
    return "cancelled";
  }

  return "pending";
}

export { normalizeOrderDisplayStatus, orderDisplayStatusLabels };
export type { OrderDisplayStatus };
