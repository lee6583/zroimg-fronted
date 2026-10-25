import clsx from "clsx";
import Link from "next/link";
import { FileClock } from "lucide-react";
import { AppPagination } from "@/components/ui/app-pagination";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PageResult } from "@/types/api";
import type { RechargeOrder } from "@/types/orders";
import { orderDisplayStatusLabels } from "@/utils/order-status";
import { OrderActions } from "./order-actions";
import styles from "./billing.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type BillingPageProps = {
  searchParams: SearchParams;
};

const defaultPageSize = 10;
const pageSizes = [10, 20, 50];

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizePage(value?: string) {
  const page = Number(value || 1);
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.floor(page));
}

function normalizePageSize(value?: string) {
  const size = Number(value || defaultPageSize);
  if (!Number.isFinite(size)) {
    return defaultPageSize;
  }

  if (pageSizes.includes(size)) {
    return size;
  }

  return defaultPageSize;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateText(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatDate(date);
}

function formatCredits(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function listOrders(pageNo: number, pageSize: number) {
  return requestJava<PageResult<RechargeOrder>>("/order/user/recharge-orders", {
    params: { pageNo, pageSize, sortBy: "create_time", isAsc: false },
  });
}

function statusClassName(status: string) {
  if (status === "paid") {
    return styles.billing__statusSuccess;
  }

  if (status === "pending") {
    return styles.billing__statusWarning;
  }

  if (status === "cancelled") {
    return styles.billing__statusDanger;
  }

  return styles.billing__statusMuted;
}

export default async function BillingPage(props: BillingPageProps) {
  const params = await props.searchParams;
  const rawPage = normalizePage(readParam(params, "page"));
  const currentPageSize = normalizePageSize(readParam(params, "pageSize"));
  await requireUser();
  let orderPage = await listOrders(rawPage, currentPageSize);

  let totalPages = Math.max(1, orderPage.pages);
  let currentPage = Math.min(rawPage, totalPages);

  if (currentPage !== rawPage) {
    orderPage = await listOrders(currentPage, currentPageSize);
    totalPages = Math.max(1, orderPage.pages);
    currentPage = Math.min(currentPage, totalPages);
  }

  const total = orderPage.total;
  const orders = orderPage.list;

  return (
    <div className={styles.billing}>
      <section className={styles.billing__header}>
        <div>
          <h1 className="page-title">我的订单</h1>
        </div>
      </section>

      {orders.length > 0 ? (
        <section className={styles.billing__tableCard} aria-label="我的订单列表">
          <div className={styles.billing__tableScroller}>
            <div className={clsx(styles.billing__tableRow, styles.billing__tableHead)}>
              <span>订单号</span>
              <span>金额</span>
              <span>积分</span>
              <span>支付方式</span>
              <span>状态</span>
              <span>创建时间</span>
              <span>支付时间</span>
              <span>操作</span>
            </div>

            <div className={styles.billing__tableBody}>
              {orders.map((order) => (
                <div key={order.orderNo} className={styles.billing__tableRow}>
                  <span className={styles.billing__orderNo}>{order.orderNo}</span>
                  <span className={styles.billing__amount}>{order.amountText}</span>
                  <span className={styles.billing__credits}>{formatCredits(order.credits)}</span>
                  <span className={styles.billing__muted}>
                    {order.payChannelText || order.payChannel || "—"}
                  </span>
                  <span>
                    <span
                      className={clsx(
                        styles.billing__statusBadge,
                        statusClassName(order.displayStatus),
                      )}
                    >
                      {orderDisplayStatusLabels[
                        order.displayStatus as keyof typeof orderDisplayStatusLabels
                      ] ?? order.displayStatus}
                    </span>
                  </span>
                  <span className={styles.billing__muted}>{formatDateText(order.createTime)}</span>
                  <span className={styles.billing__muted}>{formatDateText(order.payTime)}</span>
                  <span className={styles.billing__muted}>
                    {order.displayStatus === "pending" ? (
                      <OrderActions orderNo={order.orderNo} canCancel />
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className={styles.billing__empty}>
          <FileClock size={24} />
          <p className={styles.billing__emptyTitle}>还没有订单</p>
          <p className={styles.billing__emptyText}>购买积分后，订单记录和到账状态会显示在这里。</p>
          <Link href="/credits" className={styles.billing__emptyAction}>
            去充值
          </Link>
        </section>
      )}

      {orders.length > 0 ? (
        <div className={styles.billing__pagination}>
          <AppPagination current={currentPage} pageSize={currentPageSize} total={total} />
        </div>
      ) : null}
    </div>
  );
}
