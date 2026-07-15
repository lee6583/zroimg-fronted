import Link from "next/link";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/bff/orders";
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

const statusLabels: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  fulfilled: "已到账",
  expired: "已过期",
  cancelled: "已取消",
  failed: "支付失败",
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
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

export default async function BillingResultPage(props: BillingResultPageProps) {
  const params = await props.searchParams;
  const orderNo = readParam(params, "order");
  const current = await requireUser();

  const orders = await prisma.paymentOrder.findMany({
    where: { userProfileId: current.profile.id },
    include: { creditPackage: true },
    orderBy: { createdAt: "desc" },
  });
  const order = orders.find((item) => item.orderNo === orderNo);

  if (!order) {
    return (
      <main className={styles.result}>
        <section className={styles.result__card}>
          <p className={styles.result__eyebrow}>Order not found</p>
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

  const paymentLabel = paymentTypeLabels[order.paymentType] ?? order.paymentType;
  const statusLabel = statusLabels[order.status] ?? order.status;
  const packageName = order.creditPackage?.name ?? "自定义积分购买";

  return (
    <main className={styles.result}>
      <section className={styles.result__card}>
        <p className={styles.result__eyebrow}>Payment order</p>
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

        <PaymentActions orderNo={order.orderNo} payUrl={order.payUrl} />
      </section>
    </main>
  );
}
