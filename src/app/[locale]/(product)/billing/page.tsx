import clsx from "clsx";
import { FileClock } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { AppPagination } from "@/components/ui/app-pagination";
import table from "@/components/ui/data-table.module.css";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PageResult } from "@/types/api";
import type { RechargeOrder } from "@/types/orders";
import { isPaymentType } from "@/features/billing/payment-channel";
import { normalizeOrderDisplayStatus } from "@/utils/order-status";
import type { OrderDisplayStatus } from "@/utils/order-status";
import { parseJavaDateTime } from "@/utils/java-time";
import { OrderActions } from "./order-actions";
import styles from "./billing.module.css";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing.meta");

  return { title: t("title") };
}

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

function listOrders(pageNo: number, pageSize: number) {
  return requestJava<PageResult<RechargeOrder>>("/order/user/recharge-orders", {
    params: { pageNo, pageSize, sortBy: "create_time", isAsc: false },
  });
}

function statusClassName(status: OrderDisplayStatus) {
  if (status === "paid") {
    return styles.billing__statusSuccess;
  }

  if (status === "pending") {
    return styles.billing__statusWarning;
  }

  return styles.billing__statusDanger;
}

export default async function BillingPage(props: BillingPageProps) {
  const params = await props.searchParams;
  const rawPage = normalizePage(readParam(params, "page"));
  const currentPageSize = normalizePageSize(readParam(params, "pageSize"));
  await requireUser();
  const t = await getTranslations("billing");
  const format = await getFormatter();
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

  function formatDateText(value?: string | null) {
    if (!value) {
      return "—";
    }

    const date = parseJavaDateTime(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return format.dateTime(date, "datetime");
  }

  function formatAmount(order: RechargeOrder) {
    return format.number(order.amountCent / 100, "currency");
  }

  function payChannelLabel(order: RechargeOrder) {
    if (isPaymentType(order.payChannel)) {
      return t(`payChannel.${order.payChannel}`);
    }

    return order.payChannelText || order.payChannel || "—";
  }

  function renderStatus(order: RechargeOrder) {
    const status = normalizeOrderDisplayStatus(order.displayStatus);

    return (
      <span className={clsx(styles.billing__statusBadge, statusClassName(status))}>
        {t(`status.${status}`)}
      </span>
    );
  }

  return (
    <div className={styles.billing}>
      <section className={styles.billing__header}>
        <div>
          <h1 className="page-title">{t("title")}</h1>
        </div>
      </section>

      {orders.length > 0 ? (
        <section
          className={clsx(table.dataTable__card, styles.billing__tableCard)}
          aria-label={t("list.label")}
        >
          <table className={clsx(table.dataTable, styles.billing__table)}>
            <colgroup>
              <col />
              <col className={styles.billing__colNum} />
              <col className={styles.billing__colNum} />
              <col className={styles.billing__colChannel} />
              <col className={styles.billing__colStatus} />
              <col className={styles.billing__colTime} />
              <col className={styles.billing__colTime} />
              <col className={styles.billing__colActions} />
            </colgroup>
            <thead>
              <tr>
                <th>{t("list.columns.orderNo")}</th>
                <th>{t("list.columns.amount")}</th>
                <th>{t("list.columns.points")}</th>
                <th>{t("list.columns.payChannel")}</th>
                <th>{t("list.columns.status")}</th>
                <th>{t("list.columns.createTime")}</th>
                <th>{t("list.columns.payTime")}</th>
                <th>{t("list.columns.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderNo}>
                  <td>
                    <span
                      className={clsx(table.dataTable__ellipsis, styles.billing__orderNo)}
                      title={order.orderNo}
                    >
                      {order.orderNo}
                    </span>
                  </td>
                  <td className={table.dataTable__num}>{formatAmount(order)}</td>
                  <td className={table.dataTable__num}>
                    <span className={styles.billing__credits}>
                      {format.number(order.credits, "points")}
                    </span>
                  </td>
                  <td className={table.dataTable__muted}>{payChannelLabel(order)}</td>
                  <td>{renderStatus(order)}</td>
                  <td className={table.dataTable__time}>{formatDateText(order.createTime)}</td>
                  <td className={table.dataTable__time}>{formatDateText(order.payTime)}</td>
                  <td className={table.dataTable__muted}>
                    {order.displayStatus === "pending" ? (
                      <OrderActions orderNo={order.orderNo} canCancel />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {orders.length > 0 ? (
        <ul className={styles.billing__cards} aria-label={t("list.label")}>
          {orders.map((order) => (
            <li key={order.orderNo} className={styles.billing__orderCard}>
              <div className={styles.billing__cardHead}>
                <span className={styles.billing__cardOrderNo} title={order.orderNo}>
                  {order.orderNo}
                </span>
                {renderStatus(order)}
              </div>
              <div className={styles.billing__cardAmounts}>
                <span className={styles.billing__cardAmount}>{formatAmount(order)}</span>
                <span className={styles.billing__credits}>
                  {t("list.pointsValue", { points: order.credits })}
                </span>
              </div>
              <dl className={styles.billing__cardMeta}>
                <div>
                  <dt>{t("list.columns.payChannel")}</dt>
                  <dd>{payChannelLabel(order)}</dd>
                </div>
                <div>
                  <dt>{t("list.columns.createTime")}</dt>
                  <dd>{formatDateText(order.createTime)}</dd>
                </div>
                {order.payTime ? (
                  <div>
                    <dt>{t("list.columns.payTime")}</dt>
                    <dd>{formatDateText(order.payTime)}</dd>
                  </div>
                ) : null}
              </dl>
              {order.displayStatus === "pending" ? (
                <div className={styles.billing__cardActions}>
                  <OrderActions orderNo={order.orderNo} canCancel />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <section className={styles.billing__empty}>
          <FileClock size={24} />
          <p className={styles.billing__emptyTitle}>{t("list.empty.title")}</p>
          <p className={styles.billing__emptyText}>{t("list.empty.text")}</p>
          <Link href="/credits" className={styles.billing__emptyAction}>
            {t("list.empty.action")}
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
