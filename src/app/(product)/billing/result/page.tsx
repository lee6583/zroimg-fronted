import Link from "next/link";
import { requireUser } from "@/server/auth";
import { JavaApiError, requestJava } from "@/server/java-api";
import type { RechargeOrder } from "@/types/orders";
import { orderDisplayStatusLabels } from "@/utils/order-status";
import { PaymentActions } from "./payment-actions";
import styles from "./result.module.css";

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

function formatAmount(value: number) {
  return `¥${value.toFixed(2)}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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

function readStatusLabel(status: string) {
  return orderDisplayStatusLabels[status as keyof typeof orderDisplayStatusLabels] ?? status;
}

function OrderNotFoundCard() {
  return (
    <main className={styles.result}>
      <section className={styles.result__card}>
        <h1 className={styles.result__title}>订单不存在</h1>
        <p className={styles.result__description}>
          没有找到当前账号下的这笔订单，请返回订单列表查看最新记录。
        </p>
        <div className={styles.result__actions}>
          <Link href="/billing" className={styles.result__payButton}>
            查看我的订单
          </Link>
          <Link href="/credits" className={styles.result__secondaryButton}>
            重新购买积分
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

function OrderLoadErrorCard(props: OrderLoadErrorCardProps) {
  const status = props.status;
  let title = "订单暂时无法加载";
  let description = props.message;

  if (status === 401) {
    title = "登录状态已失效";
    description = "请重新登录后再查看订单。";
  }

  return (
    <main className={styles.result}>
      <section className={styles.result__card}>
        <h1 className={styles.result__title}>{title}</h1>
        <p className={styles.result__description}>{description}</p>
        <div className={styles.result__actions}>
          <Link href="/billing" className={styles.result__payButton}>
            查看我的订单
          </Link>
        </div>
      </section>
    </main>
  );
}

type RechargeOrderCardProps = {
  order: RechargeOrder;
};

function RechargeOrderCard(props: RechargeOrderCardProps) {
  const order = props.order;
  const paymentLabel = order.payChannelText || order.payChannel || "—";
  const canPay = order.displayStatus === "pending";
  const isCancellable = order.displayStatus === "pending";

  return (
    <main className={styles.result}>
      <section className={styles.result__card}>
        <h1 className={styles.result__title}>订单已创建</h1>

        <div className={styles.result__details} aria-label="订单信息">
          <div className={styles.result__row}>
            <span>订单号</span>
            <span className={`${styles.result__value} ${styles.result__orderNo}`}>
              {order.orderNo}
            </span>
          </div>
          <div className={styles.result__row}>
            <span>购买内容</span>
            <span className={styles.result__value}>{order.packageName}</span>
          </div>
          <div className={styles.result__row}>
            <span>支付金额</span>
            <span className={styles.result__value}>{order.amountText}</span>
          </div>
          {order.feeAmountCent > 0 ? (
            <>
              <div className={styles.result__row}>
                <span>充值本金</span>
                <span className={styles.result__value}>
                  {formatAmount(order.rechargeAmountCent / 100)}
                </span>
              </div>
              <div className={styles.result__row}>
                <span>充值手续费</span>
                <span className={styles.result__value}>
                  {formatAmount(order.feeAmountCent / 100)}
                </span>
              </div>
            </>
          ) : null}
          <div className={styles.result__row}>
            <span>到账积分</span>
            <span className={styles.result__value}>{order.credits} 积分</span>
          </div>
          <div className={styles.result__row}>
            <span>支付方式</span>
            <span className={styles.result__value}>{paymentLabel}</span>
          </div>
          <div className={styles.result__row}>
            <span>订单状态</span>
            <span className={styles.result__value}>{readStatusLabel(order.displayStatus)}</span>
          </div>
          <div className={styles.result__row}>
            <span>创建时间</span>
            <span className={styles.result__value}>{formatDateText(order.createTime)}</span>
          </div>
          <div className={styles.result__row}>
            <span>过期时间</span>
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

  if (result.status === 404) {
    return <OrderNotFoundCard />;
  }

  if (!result.order) {
    return <OrderLoadErrorCard status={result.status} message={result.message} />;
  }

  return <RechargeOrderCard order={result.order} />;
}
