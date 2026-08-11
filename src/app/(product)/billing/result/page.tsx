import Link from "next/link";
import { requireUser } from "@/server/auth";
import { getJavaRechargeOrder, prisma } from "@/server/bff/orders";
import { isMockPaymentBffEnabled } from "@/server/env";
import { getJavaApiErrorStatus } from "@/server/java-api";
import type { RechargeOrder } from "@/types/orders";
import { normalizeOrderDisplayStatus, orderDisplayStatusLabels } from "@/utils/order-status";
import { PaymentActions } from "./payment-actions";
import styles from "./result.module.css";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type BillingResultPageProps = {
  searchParams: SearchParams;
};

const paymentTypeLabels: Record<string, string> = {
  alipay: "支付宝",
  wxpay: "微信支付",
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
  return orderDisplayStatusLabels[normalizeOrderDisplayStatus(status)];
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

function OrderLoadErrorCard(props: { status: number }) {
  const status = props.status;
  let title = "订单暂时无法加载";
  let description = "订单服务暂时不可用，请稍后重新加载。";

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

function JavaRechargeOrderCard(props: { order: RechargeOrder }) {
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

async function readJavaOrder(orderNo: string) {
  try {
    return { order: await getJavaRechargeOrder(orderNo), status: 200 };
  } catch (error) {
    return { order: null, status: getJavaApiErrorStatus(error) };
  }
}

export default async function BillingResultPage(props: BillingResultPageProps) {
  const params = await props.searchParams;
  const orderNo = readOrderNo(params);
  const current = await requireUser();

  if (!orderNo) {
    return <OrderNotFoundCard />;
  }

  if (!isMockPaymentBffEnabled()) {
    const result = await readJavaOrder(orderNo);

    if (result.status === 404) {
      return <OrderNotFoundCard />;
    }

    if (!result.order) {
      return <OrderLoadErrorCard status={result.status} />;
    }

    return <JavaRechargeOrderCard order={result.order} />;
  }

  const orders = await prisma.paymentOrder.findMany({
    where: { userProfileId: current.profile.id },
    include: { creditPackage: true },
    orderBy: { createdAt: "desc" },
  });
  const order = orders.find((item) => item.orderNo === orderNo);

  if (!order) {
    return <OrderNotFoundCard />;
  }

  const paymentLabel = paymentTypeLabels[order.paymentType] ?? order.paymentType;
  const statusLabel = readStatusLabel(order.status);
  const packageName = order.creditPackage?.name ?? "自定义积分购买";
  const canPay = order.status === "pending";

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
            <span className={styles.result__value}>{packageName}</span>
          </div>
          <div className={styles.result__row}>
            <span>支付金额</span>
            <span className={styles.result__value}>{formatAmount(order.amountCny)}</span>
          </div>
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
            <span className={styles.result__value}>{statusLabel}</span>
          </div>
          <div className={styles.result__row}>
            <span>创建时间</span>
            <span className={styles.result__value}>{formatDate(order.createdAt)}</span>
          </div>
        </div>

        <PaymentActions orderNo={order.orderNo} payUrl={order.payUrl} canPay={canPay} />
      </section>
    </main>
  );
}
