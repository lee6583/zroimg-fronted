import clsx from "clsx";
import { ArrowDownRight, ArrowUpRight, ChevronRight, Minus } from "lucide-react";
import Link from "next/link";
import { DashboardTrend } from "@/features/admin/dashboard-trend";
import workspace from "@/features/admin/admin-workspace.module.css";
import { requireAdmin } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type {
  AdminDashboardKpi,
  AdminDashboardSummary,
  AdminDashboardTrend,
  AdminModelUsage,
  AdminRechargeOrderPage,
  GenerationQueueStats,
} from "@/types/admin";
import { describeChange, formatNumber, formatYuan } from "@/utils/dashboard";
import { orderDisplayStatusLabels } from "@/utils/order-status";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminPageProps = {
  searchParams: SearchParams;
};

type KpiCard = {
  label: string;
  kpi: AdminDashboardKpi;
  value: string;
  fractionDigits: number;
  href: string;
};

function readDays(params: Record<string, string | string[] | undefined>) {
  const value = params.days;
  const raw = Array.isArray(value) ? value[0] : value;

  if (raw === "30") {
    return 30;
  }

  return 7;
}

function formatDateText(value: string) {
  return value.slice(5, 16).replace("T", " ");
}

function orderStatusClass(status: string) {
  if (status === "paid") return workspace.statusSuccess;
  if (status === "pending") return workspace.statusWarning;
  return undefined;
}

function readOrderStatus(status: string) {
  return orderDisplayStatusLabels[status as keyof typeof orderDisplayStatusLabels] ?? status;
}

function formatRate(rate: number | null) {
  if (rate === null) {
    return "—";
  }

  return `${formatNumber(rate, 1)}%`;
}

export default async function AdminPage(props: AdminPageProps) {
  await requireAdmin();
  const params = await props.searchParams;
  const days = readDays(params);

  const [summary, trend, modelUsage, queue, orderPage] = await Promise.all([
    requestJava<AdminDashboardSummary>("/dashboard/admin/summary"),
    requestJava<AdminDashboardTrend>("/dashboard/admin/trend", { params: { days } }),
    requestJava<AdminModelUsage[]>("/dashboard/admin/model-usage", { params: { days } }),
    requestJava<GenerationQueueStats>("/generation/admin/queue/stats"),
    requestJava<AdminRechargeOrderPage>("/order/admin/recharge-orders", {
      params: { pageNo: 1, pageSize: 8, sortBy: "create_time", isAsc: false },
    }),
  ]);
  const orders = orderPage.list;

  const kpis: KpiCard[] = [
    {
      label: "今日收入",
      kpi: summary.revenue,
      value: formatYuan(summary.revenue.today),
      fractionDigits: 2,
      href: "/admin/orders?status=paid",
    },
    {
      label: "今日订单",
      kpi: summary.orders,
      value: formatNumber(summary.orders.today),
      fractionDigits: 0,
      href: "/admin/orders?status=paid",
    },
    {
      label: "今日生成任务",
      kpi: summary.tasks,
      value: formatNumber(summary.tasks.today),
      fractionDigits: 0,
      href: "/admin/generations",
    },
    {
      label: "今日新增用户",
      kpi: summary.users,
      value: formatNumber(summary.users.today),
      fractionDigits: 0,
      href: "/admin/users",
    },
  ];

  const attention = [
    {
      label: "失败生成任务",
      scope: "近 24 小时",
      value: summary.failedTasks24h,
      href: "/admin/generations?status=failed",
      isDanger: true,
    },
    {
      label: "待审核投稿",
      scope: null,
      value: summary.pendingGallery,
      href: "/admin/gallery",
      isDanger: false,
    },
    {
      label: "待处理反馈",
      scope: null,
      value: summary.openTickets,
      href: "/admin/tickets",
      isDanger: false,
    },
  ];

  const queueRows = [
    {
      label: "图片",
      pending: queue.imagePending,
      processing: queue.imageProcessing,
      concurrency: queue.imageConcurrency,
    },
    {
      label: "视频",
      pending: queue.videoPending,
      processing: queue.videoProcessing,
      concurrency: queue.videoConcurrency,
    },
  ];

  return (
    <div className={styles.overview}>
      <header className={styles.header}>
        <h1 className="page-title">管理概览</h1>
        <span className={styles.date}>{summary.date}</span>
      </header>

      <section className={styles.kpis} aria-label="今日指标">
        {kpis.map((card) => {
          const change = describeChange(card.kpi, card.fractionDigits);
          let Icon = Minus;
          if (change.direction === "up") Icon = ArrowUpRight;
          if (change.direction === "down") Icon = ArrowDownRight;

          return (
            <Link key={card.label} href={card.href} className={styles.kpi}>
              <span className={styles.kpi__label}>{card.label}</span>
              <span className={styles.kpi__value}>{card.value}</span>
              <span className={styles.kpi__change}>
                <span
                  className={clsx(
                    styles.kpi__delta,
                    change.direction === "up" && styles.kpi__deltaUp,
                    change.direction === "down" && styles.kpi__deltaDown,
                  )}
                >
                  <Icon size={13} aria-hidden="true" />
                  {change.label}
                </span>
                <span className={styles.kpi__compare}>较昨日 {change.delta}</span>
              </span>
            </Link>
          );
        })}
      </section>

      <div className={styles.mainGrid}>
        <DashboardTrend points={trend.points} days={trend.days} />

        <aside className={styles.side}>
          <section className={styles.panel}>
            <header className={styles.panel__header}>
              <h2 className={styles.panel__title}>需要关注</h2>
            </header>
            <div className={styles.attention}>
              {attention.map((item) => (
                <Link key={item.label} href={item.href} className={styles.attention__item}>
                  <span className={styles.attention__label}>
                    {item.label}
                    {item.scope ? (
                      <span className={styles.attention__scope}>{item.scope}</span>
                    ) : null}
                  </span>
                  <span
                    className={clsx(
                      styles.attention__value,
                      item.value === 0 && styles.attention__valueZero,
                      item.value > 0 && item.isDanger && styles.attention__valueDanger,
                    )}
                  >
                    {formatNumber(item.value)}
                  </span>
                  <ChevronRight size={14} className={styles.attention__arrow} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <header className={styles.panel__header}>
              <h2 className={styles.panel__title}>生成队列</h2>
              <Link href="/admin/settings?section=generation" className={styles.panel__link}>
                并发设置
              </Link>
            </header>
            <div className={styles.queue}>
              {queueRows.map((row) => {
                const usage = row.concurrency > 0 ? row.processing / row.concurrency : 0;
                const percent = Math.min(100, Math.round(usage * 100));

                return (
                  <div key={row.label} className={styles.queue__row}>
                    <div className={styles.queue__head}>
                      <span className={styles.queue__label}>{row.label}</span>
                      <span className={styles.queue__numbers}>
                        运行 <strong>{row.processing}</strong>
                        {row.concurrency > 0 ? ` / ${row.concurrency}` : " · 不限制"}
                        <span className={styles.queue__divider} aria-hidden="true" />
                        排队 <strong>{row.pending}</strong>
                      </span>
                    </div>
                    {row.concurrency > 0 ? (
                      <div
                        className={styles.queue__bar}
                        role="meter"
                        aria-label={`${row.label}并发占用`}
                        aria-valuemin={0}
                        aria-valuemax={row.concurrency}
                        aria-valuenow={row.processing}
                      >
                        <span style={{ width: `${percent}%` }} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

      <div className={styles.lowerGrid}>
        <section className={styles.panel}>
          <header className={styles.panel__header}>
            <h2 className={styles.panel__title}>模型调用情况</h2>
            <span className={styles.panel__meta}>近 {days} 天</span>
          </header>
          {modelUsage.length > 0 ? (
            <div className={workspace.tableWrap}>
              <table className={clsx(workspace.table, styles.compactTable)}>
                <colgroup>
                  <col />
                  <col className={styles.colCount} />
                  <col className={styles.colCount} />
                  <col className={styles.colCount} />
                  <col className={styles.colRate} />
                  <col className={styles.colPoints} />
                </colgroup>
                <thead>
                  <tr>
                    <th>模型</th>
                    <th className={styles.numericCell}>调用</th>
                    <th className={styles.numericCell}>成功</th>
                    <th className={styles.numericCell}>失败</th>
                    <th className={styles.numericCell}>成功率</th>
                    <th className={styles.numericCell}>消耗积分</th>
                  </tr>
                </thead>
                <tbody>
                  {modelUsage.map((row) => (
                    <tr key={`${row.modelCode}-${row.modelType}`}>
                      <td>
                        <div className={styles.modelCell}>
                          <span className={workspace.primaryText} title={row.modelCode}>
                            {row.modelName}
                          </span>
                          <span className={workspace.badge}>
                            {row.modelType === "video" ? "视频" : "图片"}
                          </span>
                        </div>
                      </td>
                      <td className={clsx(styles.numericCell, workspace.numeric)}>
                        {formatNumber(row.total)}
                      </td>
                      <td className={styles.numericCell}>{formatNumber(row.succeeded)}</td>
                      <td
                        className={clsx(styles.numericCell, row.failed > 0 && styles.failedCount)}
                      >
                        {formatNumber(row.failed)}
                      </td>
                      <td className={styles.numericCell}>{formatRate(row.successRate)}</td>
                      <td className={styles.numericCell}>{formatNumber(row.points)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.empty}>近 {days} 天暂无生成任务</p>
          )}
        </section>

        <section className={styles.panel}>
          <header className={styles.panel__header}>
            <h2 className={styles.panel__title}>最近订单</h2>
            <Link href="/admin/orders" className={styles.panel__link}>
              全部订单
            </Link>
          </header>
          {orders.length > 0 ? (
            <div className={workspace.tableWrap}>
              <table className={clsx(workspace.table, styles.compactTable)}>
                <colgroup>
                  <col />
                  <col className={styles.colUser} />
                  <col className={styles.colAmount} />
                  <col className={styles.colOrderStatus} />
                  <col className={styles.colTime} />
                </colgroup>
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>用户</th>
                    <th className={styles.numericCell}>金额</th>
                    <th>状态</th>
                    <th>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.orderNo}>
                      <td>
                        <span
                          className={clsx(workspace.monoText, styles.cellText)}
                          title={order.orderNo}
                        >
                          {order.orderNo}
                        </span>
                      </td>
                      <td>
                        <span
                          className={clsx(workspace.truncate, styles.cellText)}
                          title={order.username ?? undefined}
                        >
                          {order.username || "未知用户"}
                        </span>
                      </td>
                      <td className={clsx(styles.numericCell, workspace.numeric)}>
                        {order.amountText}
                      </td>
                      <td>
                        <span
                          className={clsx(workspace.status, orderStatusClass(order.displayStatus))}
                        >
                          {readOrderStatus(order.displayStatus)}
                        </span>
                      </td>
                      <td className={workspace.dateText}>{formatDateText(order.createTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.empty}>暂无订单</p>
          )}
        </section>
      </div>
    </div>
  );
}
