import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { UserActions } from "@/features/admin/user-actions";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/bff/orders";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(input: { q?: string; status?: string; page: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  params.set("page", String(input.page));
  return `/admin/users?${params.toString()}`;
}

export default async function AdminUsersPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const params = await searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const statusFilter = status === "active" || status === "banned" ? status : undefined;
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const pageSize = 20;
  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" as const } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const [users, total] = await Promise.all([
    prisma.userProfile.findMany({
      where,
      include: {
        user: true,
        _count: { select: { tasks: true, paymentOrders: true, creditLedger: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.userProfile.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell active="users">
      <div className="grid gap-6">
        <section>
          <p className="label">Users</p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight md:text-5xl">
            用户管理
          </h1>
          <p className="mt-3 text-sm text-muted">搜索用户、调整积分、封禁或查看用户详情。</p>
        </section>

        <section className="surface rounded-xl p-5">
          <form className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <input
              className="field text-sm"
              name="q"
              defaultValue={q || ""}
              placeholder="搜索用户名或邮箱"
            />
            <Link className={`btn-secondary ${!status ? "bg-soft" : ""}`} href="/admin/users">
              全部
            </Link>
            <Link
              className={`btn-secondary ${status === "active" ? "bg-soft" : ""}`}
              href={pageHref({ q, status: "active", page: 1 })}
            >
              正常
            </Link>
            <Link
              className={`btn-secondary ${status === "banned" ? "bg-soft" : ""}`}
              href={pageHref({ q, status: "banned", page: 1 })}
            >
              封禁
            </Link>
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <button className="btn-primary md:col-start-1 md:w-fit" type="submit">
              搜索
            </button>
          </form>
        </section>

        <section className="grid gap-3">
          {users.map((profile) => (
            <article key={profile.id} className="surface rounded-xl p-4">
              <div className="mb-3 flex flex-wrap justify-between gap-3">
                <div>
                  <Link
                    href={`/admin/users/${profile.id}`}
                    className="font-semibold transition hover:text-muted"
                  >
                    {profile.username}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {profile.user?.email || "-"} / {profile.role} / {profile.status}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    任务 {profile._count?.tasks || 0} / 订单 {profile._count?.paymentOrders || 0} /
                    流水 {profile._count?.creditLedger || 0}
                  </p>
                </div>
                <p className="font-semibold">{profile.creditBalance} 积分</p>
              </div>
              <UserActions userId={profile.id} status={profile.status} />
            </article>
          ))}
          {users.length === 0 ? (
            <p className="surface rounded-xl p-8 text-center text-sm text-muted">没有匹配用户</p>
          ) : null}
        </section>

        <nav className="flex items-center justify-between">
          <Link
            className="btn-secondary"
            href={pageHref({ q, status, page: Math.max(1, page - 1) })}
          >
            上一页
          </Link>
          <p className="text-sm text-muted">
            第 {page} / {totalPages} 页，共 {total} 位用户
          </p>
          <Link
            className="btn-secondary"
            href={pageHref({ q, status, page: Math.min(totalPages, page + 1) })}
          >
            下一页
          </Link>
        </nav>
      </div>
    </AdminShell>
  );
}
