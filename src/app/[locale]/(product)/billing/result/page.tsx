import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { CircleAlert, ReceiptText } from "lucide-react";
import { isPaymentType } from "@/features/billing/payment-channel";
import { requireUser } from "@/server/auth";
import { JavaApiError, requestJava } from "@/server/java-api";
import type { RechargeOrder } from "@/types/orders";
import { parseJavaDateTime } from "@/utils/java-time";
import { normalizeOrderDisplayStatus } from "@/utils/order-status";
import { PaymentActions } from "./payment-actions";
import styles from "./result.module.css";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("billing.meta");

  return { title: t("resultTitle") };
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type BillingResultPageProps = {
  searchParams: SearchParams;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function readOrderNo(params: Record<string, string | string[] | undefined>) {
  const orderNo = readParam(params, "order");
  if (orderNo) {
    return orderNo;
  }

  return readParam(params, "out_trade_no");
}

async function OrderNotFoundCard() {
  const t = await getTranslations("billing.result");

  return (
    <main className={styles.result}>
      <section className={styles.result__card}>
        <span className={styles.result__icon} aria-hidden="true">
          <CircleAlert size={22} />
        </span>
        <h1 className={styles.result__title}>{t("notFound.title")}</h1>
        <p className={styles.result__description}>{t("notFound.description")}</p>
        <div className={styles.result__actions}>
          <Link href="/billing" className={styles.result__payButton}>
            {t("actions.viewOrders")}
          </Link>
          <Link href="/credits" className={styles.result__secondaryButton}>
            {t("actions.buyAgain")}
          </Link>
        </div>
      </section>
    </main>
  );
}

type OrderLoadErrorCardProps = {
  status: number;
  message: string;
};

async function OrderLoadErrorCard(props: OrderLoadErrorCardProps) {
  const status = props.status;
  const t = await getTranslations("billing.result");
  let title = t("loadError.title");
  let description = props.message;

  if (status === 401) {
    title = t("unauthorized.title");
    description = t("unauthorized.description");
  }

  return (
    <main className={styles.result}>
      <section className={styles.result__card}>
        <span className={styles.result__icon} aria-hidden="true">
          <CircleAlert size={22} />
        </span>
        <h1 className={styles.result__title}>{title}</h1>
        <p className={styles.result__description}>{description}</p>
        <div className={styles.result__actions}>
          <Link href="/billing" className={styles.result__payButton}>
            {t("actions.viewOrders")}
          </Link>
        </div>
      </section>
    </main>
  );
}

type RechargeOrderCardProps = {
  order: RechargeOrder;
};

async function RechargeOrderCard(props: RechargeOrderCardProps) {
  const order = props.order;
  const t = await getTranslations("billing");
  const format = await getFormatter();
  const status = normalizeOrderDisplayStatus(order.displayStatus);
  let paymentLabel = order.payChannelText || order.payChannel || "—";
  if (isPaymentType(order.payChannel)) {
    paymentLabel = t(`payChannel.${order.payChannel}`);
  }

  function formatAmount(amountCent: number) {
    return format.number(amountCent / 100, "currency");
  }

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

  const canPay = order.displayStatus === "pending";
  const isCancellable = order.displayStatus === "pending";

  return (
    <main className={styles.result}>
      <section className={styles.result__card}>
        <span className={styles.result__icon} aria-hidden="true">
          <ReceiptText size={22} />
        </span>
        <h1 className={styles.result__title}>{t("result.created")}</h1>
        <p className={styles.result__amount}>{formatAmount(order.amountCent)}</p>

        <div className={styles.result__details} aria-label={t("result.detailsLabel")}>
          <div className={styles.result__row}>
            <span>{t("result.fields.orderNo")}</span>
            <span
              className={`${styles.result__value} ${styles.result__orderNo}`}
              title={order.orderNo}
            >
              {order.orderNo}
            </span>
          </div>
          <div className={styles.result__row}>
            <span>{t("result.fields.package")}</span>
            <span className={styles.result__value}>{order.packageName}</span>
          </div>
          <div className={styles.result__row}>
            <span>{t("result.fields.amount")}</span>
            <span className={styles.result__value}>{formatAmount(order.amountCent)}</span>
          </div>
          {order.feeAmountCent > 0 ? (
            <>
              <div className={styles.result__row}>
                <span>{t("result.fields.rechargeAmount")}</span>
                <span className={styles.result__value}>
                  {formatAmount(order.rechargeAmountCent)}
                </span>
              </div>
              <div className={styles.result__row}>
                <span>{t("result.fields.fee")}</span>
                <span className={styles.result__value}>{formatAmount(order.feeAmountCent)}</span>
              </div>
            </>
          ) : null}
          <div className={styles.result__row}>
            <span>{t("result.fields.points")}</span>
            <span className={styles.result__value}>
              {t("result.pointsValue", { points: order.credits })}
            </span>
          </div>
          <div className={styles.result__row}>
            <span>{t("result.fields.payChannel")}</span>
            <span className={styles.result__value}>{paymentLabel}</span>
          </div>
          <div className={styles.result__row}>
            <span>{t("result.fields.status")}</span>
            <span className={styles.result__value}>{t(`status.${status}`)}</span>
          </div>
          <div className={styles.result__row}>
            <span>{t("result.fields.createTime")}</span>
            <span className={styles.result__value}>{formatDateText(order.createTime)}</span>
          </div>
          <div className={styles.result__row}>
            <span>{t("result.fields.expireTime")}</span>
            <span className={styles.result__value}>{formatDateText(order.expireTime)}</span>
          </div>
        </div>

        <PaymentActions
          orderNo={order.orderNo}
          payUrl={null}
          canPay={canPay}
          canCancel={isCancellable}
        />
      </section>
    </main>
  );
}

async function fetchOrder(orderNo: string) {
  try {
    const path = `/order/user/recharge-orders/${encodeURIComponent(orderNo)}`;
    const order = await requestJava<RechargeOrder>(path);
    return { order, status: 200, message: "" };
  } catch (error) {
    if (error instanceof JavaApiError) {
      return { order: null, status: error.status, message: error.message };
    }

    throw error;
  }
}

export default async function BillingResultPage(props: BillingResultPageProps) {
  const params = await props.searchParams;
  const orderNo = readOrderNo(params);
  await requireUser();

  if (!orderNo) {
    return <OrderNotFoundCard />;
  }

  const result = await fetchOrder(orderNo);

  // Java 对不存在或不属于当前用户的订单号返回 400/404。
  if (result.status === 400 || result.status === 404) {
    return <OrderNotFoundCard />;
  }

  if (!result.order) {
    return <OrderLoadErrorCard status={result.status} message={result.message} />;
  }

  return <RechargeOrderCard order={result.order} />;
}
