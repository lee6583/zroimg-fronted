import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { UserActions } from "@/features/admin/user-actions";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/db";

export const dynamic = "force-dynamic";

function formatDate(value: Date) {
  return value.toISOString().slice(0, 16).replace("T", " ");
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const profile = await prisma.userProfile.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!profile) notFound();

  const [ledger, orders, tasks] = await Promise.all([
    prisma.creditLedger.findMany({
      where: { userProfileId: id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.paymentOrder.findMany({
      where: { userProfileId: id },
      include: { creditPackage: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.generationTask.findMany({
      where: { userProfileId: id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return (
    <AdminShell active="users">
      <div className="grid gap-6">
        <section className="surface rounded-xl p-5">
          <Link href="/admin/users" className="text-sm font-medium text-muted transition hover:text-foreground">
            返回用户管理
          </Link>
          <div className="mt-4 flex flex-wrap justify-between gap-4">
            <div>
              <p className="label">User detail</p>
              <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight">{profile.username}</h1>
              <p className="mt-2 text-sm text-muted">
                {profile.user?.email || "-"} / {profile.role} / {profile.status}
              </p>
            </div>
            <p className="text-2xl font-semibold">{profile.creditBalance} 积分</p>
          </div>
          <div className="mt-5">
            <UserActions userId={profile.id} status={profile.status} />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-3">
          <div className="surface rounded-xl p-5">
            <h2 className="font-serif text-2xl font-medium">积分流水</h2>
            <div className="mt-4 grid gap-2">
              {ledger.map((item) => (
                <div key={item.id} className="rounded-lg border border-line p-3">
                  <div className="flex justify-between gap-3">
                    <p className={item.amount >= 0 ? "text-foreground" : "text-danger"}>{item.amount > 0 ? `+${item.amount}` : item.amount}</p>
                    <p className="text-sm text-muted">{item.balanceAfter} 余额</p>
                  </div>
                  <p className="mt-1 text-xs text-muted">{item.reason} / {formatDate(item.createdAt)}</p>
                </div>
              ))}
              {ledger.length === 0 ? <p className="text-sm text-muted">暂无流水</p> : null}
            </div>
          </div>

          <div className="surface rounded-xl p-5">
            <h2 className="font-serif text-2xl font-medium">最近订单</h2>
            <div className="mt-4 grid gap-2">
              {orders.map((order) => (
                <div key={order.id} className="rounded-lg border border-line p-3">
                  <p className="font-medium">{order.creditPackage?.name ?? "自定义充值"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {order.status} / ¥{order.amountCny.toString()} / {formatDate(order.createdAt)}
                  </p>
                </div>
              ))}
              {orders.length === 0 ? <p className="text-sm text-muted">暂无订单</p> : null}
            </div>
          </div>

          <div className="surface rounded-xl p-5">
            <h2 className="font-serif text-2xl font-medium">最近生成</h2>
            <div className="mt-4 grid gap-2">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-lg border border-line p-3">
                  <p className="truncate font-medium">{task.prompt}</p>
                  <p className="mt-1 text-sm text-muted">
                    {task.status} / {task.costCredits} 积分 / {formatDate(task.createdAt)}
                  </p>
                  {task.error ? <p className="mt-1 text-xs text-danger">{task.error}</p> : null}
                </div>
              ))}
              {tasks.length === 0 ? <p className="text-sm text-muted">暂无生成任务</p> : null}
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
