import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { StatCard } from "@/components/ui/stat-card";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/bff/orders";
import { feedbackStatusLabels } from "@/utils/feedback";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [users, tasks, orders, failedTasks, openTickets, latestTickets] = await Promise.all([
    prisma.userProfile.count(),
    prisma.generationTask.count(),
    prisma.paymentOrder.count(),
    prisma.generationTask.count({ where: { status: "failed" } }),
    prisma.feedbackTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.feedbackTicket.findMany({
      include: { userProfile: { include: { user: true } } },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
  ]);

  return (
    <AdminShell active="overview">
      <div className="grid gap-6">
        <section>
          <p className="label">Admin overview</p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight md:text-5xl">
            管理概览
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            查看站点运营状态、待处理反馈和关键业务指标。
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-5">
          <StatCard label="用户" value={users} />
          <StatCard label="生成任务" value={tasks} />
          <StatCard label="订单" value={orders} />
          <StatCard label="失败任务" value={failedTasks} />
          <StatCard label="待处理反馈" value={openTickets} />
        </section>

        <section className="surface rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="label">Feedback</p>
              <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight">最近反馈</h2>
            </div>
            <Link href="/admin/tickets" className="btn-secondary">
              查看全部
            </Link>
          </div>
          <div className="mt-5 grid gap-2">
            {latestTickets.length === 0 ? (
              <p className={styles.adminOverview__emptyFeedback}>暂无反馈</p>
            ) : (
              latestTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href="/admin/tickets"
                  className={styles.adminOverview__feedbackItem}
                >
                  <div className="flex flex-wrap justify-between gap-3">
                    <p className="font-medium">{ticket.subject}</p>
                    <p className="text-sm text-muted">{feedbackStatusLabels[ticket.status]}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {ticket.userProfile?.user?.email || "-"}
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
