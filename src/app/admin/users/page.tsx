import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { UserActions } from "@/features/admin/user-actions";
import { requireAdmin } from "@/server/auth";
import { listAdminUsers } from "@/server/bff/users";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminUsersPageProps = {
  searchParams: SearchParams;
};

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

export default async function AdminUsersPage(props: AdminUsersPageProps) {
  const searchParams = props.searchParams;

  await requireAdmin();
  const params = await searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const statusFilter = status === "active" || status === "banned" ? status : undefined;
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const pageSize = 20;
  const userPage = await listAdminUsers({
    page,
    pageSize,
    q,
    status: statusFilter,
  });
  const users = userPage.list;
  const total = userPage.total;
  const totalPages = Math.max(1, userPage.pages);

  return (
    <AdminShell active="users">
      <div className="grid gap-6">
        <section>
          <h1 className="page-title">用户管理</h1>
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
                    {profile.email || "-"} / {profile.role} / {profile.status}
                  </p>
                </div>
                <p className="font-semibold">{profile.totalPoints} 积分</p>
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
