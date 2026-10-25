type OrderDisplayStatus = "pending" | "paid" | "cancelled";

const orderDisplayStatusLabels: Record<OrderDisplayStatus, string> = {
  pending: "待支付",
  paid: "已支付",
  cancelled: "已取消",
};

// 同时接受 Java 的 displayStatus 和 payStatus（pending/paying/paid/failed/closed）。
function normalizeOrderDisplayStatus(status: string): OrderDisplayStatus {
  if (status === "paid") {
    return "paid";
  }

  if (status === "cancelled" || status === "closed" || status === "failed") {
    return "cancelled";
  }

  return "pending";
}

export { normalizeOrderDisplayStatus, orderDisplayStatusLabels };
export type { OrderDisplayStatus };
