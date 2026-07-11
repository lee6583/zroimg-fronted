import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/bff/orders";

export const dynamic = "force-dynamic";

const orderStatuses = ["pending", "paid", "fulfilled", "expired", "cancelled", "failed"] as const;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 16).replace("T", " ") : "-";
}

function href(input: { q?: string; status?: string; page: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  params.set("page", String(input.page));
  return `/admin/orders?${params.toString()}`;
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const pageSize = 20;
  const where = {
    ...(orderStatuses.includes(status as (typeof orderStatuses)[number])
      ? { status: status as (typeof orderStatuses)[number] }
      : {}),
    ...(q
      ? {
          OR: [
            { orderNo: { contains: q, mode: "insensitive" as const } },
            { providerTradeNo: { contains: q, mode: "insensitive" as const } },
            { userProfile: { user: { email: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };
  const [orders, total] = await Promise.all([
    prisma.paymentOrder.findMany({
      where,
      include: { userProfile: { include: { user: true } }, creditPackage: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.paymentOrder.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell active="orders">
      <div className="grid gap-6">
        <section>
          <p className="label">Orders</p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight md:text-5xl">
            订单管理
          </h1>
          <p className="mt-3 text-sm text-muted">查看支付订单、支付状态和积分套餐。</p>
        </section>

        <section className="surface rounded-xl p-5">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className="field text-sm"
              name="q"
              defaultValue={q || ""}
              placeholder="搜索订单号、交易号或用户邮箱"
            />
            <button className="btn-primary" type="submit">
              搜索
            </button>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Link className={`btn-secondary ${!status ? "bg-soft" : ""}`} href="/admin/orders">
                全部
              </Link>
              {orderStatuses.map((item) => (
                <Link
                  key={item}
                  className={`btn-secondary ${status === item ? "bg-soft" : ""}`}
                  href={href({ q, status: item, page: 1 })}
                >
                  {item}
                </Link>
              ))}
            </div>
          </form>
        </section>

        <section className="grid gap-2">
          {orders.map((order) => (
            <article key={order.id} className="surface rounded-xl p-4">
              <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
                <div>
                  <p className="font-semibold">{order.orderNo}</p>
                  <p className="mt-1 text-sm text-muted">{order.userProfile?.user?.email || "-"}</p>
                </div>
                <div>
                  <p>{order.creditPackage?.name ?? "自定义充值"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {order.credits} 积分 / ¥{order.amountCny.toString()}
                  </p>
                </div>
                <div>
                  <p>{order.status}</p>
                  <p className="mt-1 text-sm text-muted">
                    {order.paymentType} / {order.providerTradeNo || "无交易号"}
                  </p>
                </div>
                <div className="text-sm text-muted lg:text-right">
                  <p>创建 {formatDate(order.createdAt)}</p>
                  <p>支付 {formatDate(order.paidAt)}</p>
                </div>
              </div>
            </article>
          ))}
          {orders.length === 0 ? (
            <p className="surface rounded-xl p-8 text-center text-sm text-muted">没有匹配订单</p>
          ) : null}
        </section>

        <nav className="flex items-center justify-between">
          <Link className="btn-secondary" href={href({ q, status, page: Math.max(1, page - 1) })}>
            上一页
          </Link>
          <p className="text-sm text-muted">
            第 {page} / {totalPages} 页，共 {total} 个订单
          </p>
          <Link
            className="btn-secondary"
            href={href({ q, status, page: Math.min(totalPages, page + 1) })}
          >
            下一页
          </Link>
        </nav>
      </div>
    </AdminShell>
  );
}
