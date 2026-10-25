import clsx from "clsx";
import {
  ArrowUpRight,
  BookOpen,
  Coins,
  MessageSquareText,
  ReceiptText,
  Settings,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import Link from "next/link";
import { requestJava } from "@/server/java-api";
import type { AdminOverview } from "@/types/admin";
import { feedbackStatusLabels } from "@/utils/feedback";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const overview = await requestJava<AdminOverview>("/dashboard/admin/overview");
  const metrics = [
    {
      label: "用户总量",
      value: overview.users,
      hint: "查看用户与积分账户",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "生成任务",
      value: overview.tasks,
      hint: "查看全部生成记录",
      href: "/admin/generations",
      icon: Sparkles,
    },
    {
      label: "充值订单",
      value: overview.orders,
      hint: "查看支付与到账状态",
      href: "/admin/orders",
      icon: ReceiptText,
    },
    {
      label: "失败任务",
      value: overview.failedTasks,
      hint: "需要关注的生成失败",
      href: "/admin/generations?status=failed",
      icon: TriangleAlert,
    },
    {
      label: "待处理反馈",
      value: overview.openTickets,
      hint: "等待管理员跟进",
      href: "/admin/tickets?status=open",
      icon: MessageSquareText,
    },
  ];

  function ticketStatusClass(status: string) {
    if (status === "open") return styles.statusOpen;
    if (status === "in_progress") return styles.statusProgress;
    if (status === "resolved" || status === "closed") return styles.statusDone;
    return undefined;
  }

  function formatDate(value: string) {
    return value.slice(0, 16).replace("T", " ");
  }

  return (
    <div className={styles.overview}>
      <header className={styles.header}>
        <div>
          <h1 className="page-title">管理概览</h1>
        </div>
        <span className={styles.health}>后台服务已连接</span>
      </header>

      <section className={styles.metrics} aria-label="核心业务指标">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Link key={metric.label} href={metric.href} className={styles.metric}>
              <div className={styles.metricHead}>
                <span>{metric.label}</span>
                <span className={styles.metricIcon}>
                  <Icon size={15} aria-hidden="true" />
                </span>
              </div>
              <div>
                <p className={styles.metricValue}>{metric.value.toLocaleString("zh-CN")}</p>
                <p className={styles.metricHint}>{metric.hint}</p>
              </div>
            </Link>
          );
        })}
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.panel}>
          <header className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>最近反馈</h2>
            <Link href="/admin/tickets" className={styles.panelLink}>
              查看全部 <ArrowUpRight size={13} />
            </Link>
          </header>
          <div className={styles.ticketList}>
            {overview.latestTickets.length === 0 ? (
              <p className={styles.empty}>暂无反馈</p>
            ) : (
              overview.latestTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/admin/tickets/${ticket.id}`}
                  className={styles.ticketItem}
                >
                  <div className={styles.ticketMain}>
                    <p className={styles.ticketTitle}>{ticket.subject}</p>
                    <p className={styles.ticketMeta}>{ticket.username || "未命名用户"}</p>
                  </div>
                  <div className={styles.ticketSide}>
                    <span className={clsx(styles.status, ticketStatusClass(ticket.status))}>
                      {feedbackStatusLabels[ticket.status as keyof typeof feedbackStatusLabels] ||
                        ticket.status}
                    </span>
                    <span className={styles.ticketTime}>{formatDate(ticket.createdAt)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <aside className={styles.sideStack}>
          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>需要关注</h2>
            </header>
            <div className={styles.attentionList}>
              <div className={styles.attentionItem}>
                <span className={styles.attentionLabel}>待处理反馈</span>
                <span className={styles.attentionValue}>{overview.openTickets}</span>
              </div>
              <div className={styles.attentionItem}>
                <span className={styles.attentionLabel}>失败生成任务</span>
                <span className={clsx(styles.attentionValue, styles.attentionDanger)}>
                  {overview.failedTasks}
                </span>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <header className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>常用管理</h2>
            </header>
            <div className={styles.quickLinks}>
              {[
                {
                  href: "/admin/models",
                  label: "模型配置",
                  icon: SlidersHorizontal,
                },
                {
                  href: "/admin/packages",
                  label: "积分套餐",
                  icon: Coins,
                },
                {
                  href: "/admin/docs",
                  label: "文档管理",
                  icon: BookOpen,
                },
                {
                  href: "/admin/settings",
                  label: "系统设置",
                  icon: Settings,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={styles.quickLink}>
                    <span className={styles.quickIcon}>
                      <Icon size={14} aria-hidden="true" />
                    </span>
                    <span className={styles.quickCopy}>
                      <strong>{item.label}</strong>
                    </span>
                    <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
