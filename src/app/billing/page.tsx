import Link from "next/link";
import { FileClock, Plus } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/bff/orders";
import styles from "./billing.module.css";

export const dynamic = "force-dynamic";

const orderStatusLabels: Record<string, string> = {
  pending: "待支付",
  paid: "已支付",
  fulfilled: "已到账",
  expired: "已过期",
  cancelled: "已取消",
  failed: "支付失败",
};

const paymentTypeLabels: Record<string, string> = {
  alipay: "alipay",
  wxpay: "wxpay",
};

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
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

function formatAmount(value: { toString: () => string }) {
  return `¥${Number(value.toString()).toFixed(2)}`;
}

function formatCredits(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function statusClassName(status: string) {
  if (status === "fulfilled" || status === "paid") return styles.billing__statusSuccess;
  if (status === "pending" || status === "expired") return styles.billing__statusWarning;
  if (status === "failed" || status === "cancelled") return styles.billing__statusDanger;
  return styles.billing__statusMuted;
}

export default async function BillingPage() {
  const current = await requireUser();
  const orders = await prisma.paymentOrder.findMany({
    where: { userProfileId: current.profile.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <AppShell active="billing">
      <div className={styles.billing}>
        <section className={styles.billing__header}>
          <div>
            <h1 className={styles.billing__title}>我的订单</h1>
            <p className={styles.billing__description}>查看充值历史与订单状态</p>
          </div>
          <Link href="/credits" className={styles.billing__rechargeButton}>
            <Plus size={17} />
            充值
          </Link>
        </section>

        {orders.length > 0 ? (
          <section className={styles.billing__tableCard} aria-label="我的订单列表">
            <div className={styles.billing__tableScroller}>
              <div className={classNames(styles.billing__tableRow, styles.billing__tableHead)}>
                <span>订单号</span>
                <span>金额</span>
                <span>积分</span>
                <span>支付方式</span>
                <span>状态</span>
                <span>创建时间</span>
                <span>支付时间</span>
              </div>

              <div className={styles.billing__tableBody}>
                {orders.map((order) => (
                  <div key={order.id} className={styles.billing__tableRow}>
                    <span className={styles.billing__orderNo}>{order.orderNo}</span>
                    <span className={styles.billing__amount}>{formatAmount(order.amountCny)}</span>
                    <span className={styles.billing__credits}>{formatCredits(order.credits)}</span>
                    <span className={styles.billing__muted}>{paymentTypeLabels[order.paymentType] ?? order.paymentType}</span>
                    <span>
                      <span className={classNames(styles.billing__statusBadge, statusClassName(order.status))}>
                        {orderStatusLabels[order.status] ?? order.status}
                      </span>
                    </span>
                    <span className={styles.billing__muted}>{formatDate(order.createdAt)}</span>
                    <span className={styles.billing__muted}>{order.paidAt ? formatDate(order.paidAt) : "—"}</span>
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
      </div>
    </AppShell>
  );
}
