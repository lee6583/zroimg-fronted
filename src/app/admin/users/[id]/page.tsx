import Link from "next/link";
import { notFound } from "next/navigation";
import { UserActions } from "@/features/admin/user-actions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { listAdminRechargeOrders } from "@/server/bff/orders";
import { getAdminUser, listAdminFlows, listAdminTasks } from "@/server/bff/users";
import { normalizeOrderDisplayStatus, orderDisplayStatusLabels } from "@/utils/order-status";

export const dynamic = "force-dynamic";

type AdminUserDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

export default async function AdminUserDetailPage(props: AdminUserDetailPageProps) {
  const params = props.params;

  const { id } = await params;
  const profile = await getAdminUser(id);
  if (!profile) notFound();

  const [flows, orderPage, tasks] = await Promise.all([
    listAdminFlows(id),
    listAdminRechargeOrders({ page: 1, pageSize: 20, userId: id }),
    listAdminTasks(id),
  ]);
  const orders = orderPage.list;

  return (
    <div className="grid gap-6">
      <section className="surface rounded-xl p-5">
        <Link
          href="/admin/users"
          className="text-sm font-medium text-muted transition hover:text-foreground"
        >
          返回用户管理
        </Link>
        <div className="mt-4 flex flex-wrap justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={profile.username} src={profile.avatarUrl} size={48} decorative />
            <h1 className="page-title">{profile.username}</h1>
          </div>
          <p className="text-2xl font-semibold">{profile.totalPoints} 积分</p>
        </div>
        <div className="mt-5">
          <UserActions user={profile} variant="button" />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <div className="surface rounded-xl p-5">
          <h2 className="font-serif text-2xl font-medium">积分流水</h2>
          <div className="mt-4 grid gap-2">
            {flows.map((item) => (
              <div key={item.id} className="rounded-lg border border-line p-3">
                <div className="flex justify-between gap-3">
                  <p className={item.amount >= 0 ? "text-foreground" : "text-danger"}>
                    {item.amount > 0 ? `+${item.amount}` : item.amount}
                  </p>
                  <p className="text-sm text-muted">{item.afterPoints} 余额</p>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {item.remark} / {formatDate(item.createdAt)}
                </p>
              </div>
            ))}
            {flows.length === 0 ? <p className="text-sm text-muted">暂无流水</p> : null}
          </div>
        </div>

        <div className="surface rounded-xl p-5">
          <h2 className="font-serif text-2xl font-medium">最近订单</h2>
          <div className="mt-4 grid gap-2">
            {orders.map((order) => (
              <div key={order.orderNo} className="rounded-lg border border-line p-3">
                <p className="font-medium">{order.packageName || "自定义充值"}</p>
                <p className="mt-1 text-sm text-muted">
                  {orderDisplayStatusLabels[normalizeOrderDisplayStatus(order.displayStatus)]} /{" "}
                  {order.amountText} / {formatDate(order.createTime)}
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
                  {task.status} / {task.requiredPoints} 积分 / {formatDate(task.createdAt)}
                </p>
                {task.failReason ? (
                  <p className="mt-1 text-xs text-danger">{task.failReason}</p>
                ) : null}
              </div>
            ))}
            {tasks.length === 0 ? <p className="text-sm text-muted">暂无生成任务</p> : null}
          </div>
        </div>
      </section>
    </div>
  );
}
