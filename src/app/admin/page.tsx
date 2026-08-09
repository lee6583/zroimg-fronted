import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdmin } from "@/server/auth";
import { getAdminOverview } from "@/server/bff/admin";
import { feedbackStatusLabels } from "@/utils/feedback";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const overview = await getAdminOverview();

  return (
    <AdminShell active="overview">
      <div className="grid gap-6">
        <section>
          <h1 className="page-title">管理概览</h1>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard label="用户" value={overview.users} />
          <StatCard label="生成任务" value={overview.tasks} />
          <StatCard label="订单" value={overview.orders} />
          <StatCard label="失败任务" value={overview.failedTasks} />
          <StatCard label="待处理反馈" value={overview.openTickets} />
        </section>

        <section className="surface rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl font-medium tracking-tight">最近反馈</h2>
            </div>
            <Link href="/admin/tickets" className="btn-secondary">
              查看全部
            </Link>
          </div>
          <div className="mt-5 grid gap-2">
            {overview.latestTickets.length === 0 ? (
              <p className={styles.adminOverview__emptyFeedback}>暂无反馈</p>
            ) : (
              overview.latestTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href="/admin/tickets"
                  className={styles.adminOverview__feedbackItem}
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-muted">
                      {feedbackStatusLabels[ticket.status as keyof typeof feedbackStatusLabels] ||
                        ticket.status}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{ticket.email || "-"}</p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
