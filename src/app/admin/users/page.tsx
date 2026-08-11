import { Eye, Search } from "lucide-react";
import Link from "next/link";
import { AppPagination } from "@/components/ui/app-pagination";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserActions } from "@/features/admin/user-actions";
import { listAdminUsers } from "@/server/bff/users";
import styles from "./users-page.module.css";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminUsersPageProps = {
  searchParams: SearchParams;
};

const pageSizeOptions = [10, 20, 50];

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function filterHref(input: { q?: string; status?: string }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  return params.size > 0 ? `/admin/users?${params.toString()}` : "/admin/users";
}

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

function roleLabel(role: string) {
  if (role === "admin") return "管理员";
  if (role === "user") return "普通用户";
  return role;
}

export default async function AdminUsersPage(props: AdminUsersPageProps) {
  const params = await props.searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const statusFilter = status === "active" || status === "banned" ? status : undefined;
  const requestedPageSize = Number(readParam(params, "pageSize") || 10);
  const pageSize = pageSizeOptions.includes(requestedPageSize) ? requestedPageSize : 10;
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const userPage = await listAdminUsers({ page, pageSize, q, status: statusFilter });
  const users = userPage.list;

  return (
    <div className={styles.usersPage}>
      <header className={styles.usersPage__heading}>
        <div>
          <h1 className="page-title">用户管理</h1>
        </div>
      </header>

      <section className={styles.usersPage__panel}>
        <div className={styles.usersPage__toolbar}>
          <form className={styles.usersPage__search}>
            <Search size={15} aria-hidden="true" />
            <input name="q" defaultValue={q || ""} placeholder="搜索用户名或邮箱" />
            {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
            {pageSize !== 10 ? <input type="hidden" name="pageSize" value={pageSize} /> : null}
            <button type="submit">搜索</button>
          </form>

          <nav className={styles.usersPage__filters} aria-label="用户状态筛选">
            <Link
              className={!statusFilter ? styles.usersPage__filterActive : undefined}
              href={filterHref({ q })}
            >
              全部
            </Link>
            <Link
              className={statusFilter === "active" ? styles.usersPage__filterActive : undefined}
              href={filterHref({ q, status: "active" })}
            >
              正常
            </Link>
            <Link
              className={statusFilter === "banned" ? styles.usersPage__filterActive : undefined}
              href={filterHref({ q, status: "banned" })}
            >
              已封禁
            </Link>
          </nav>
        </div>

        {users.length > 0 ? (
          <div className={styles.usersPage__tableWrap}>
            <table className={styles.usersPage__table}>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>用户 ID</th>
                  <th>角色</th>
                  <th>积分余额</th>
                  <th>状态</th>
                  <th>注册时间</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className={styles.usersPage__userCell}>
                        <UserAvatar
                          name={user.username}
                          src={user.avatarUrl}
                          size={34}
                          decorative
                        />
                        <div>
                          <Link href={`/admin/users/${user.id}`}>{user.username}</Link>
                          <span className={styles.usersPage__userMeta}>
                            {user.email || "未填写邮箱"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={styles.usersPage__id} title={user.id}>
                        {user.id}
                      </span>
                    </td>
                    <td>{roleLabel(user.role)}</td>
                    <td className={styles.usersPage__points}>
                      {user.totalPoints.toLocaleString("zh-CN")}
                    </td>
                    <td>
                      <span
                        className={`${styles.usersPage__status} ${
                          user.status === "active"
                            ? styles.usersPage__statusActive
                            : styles.usersPage__statusBanned
                        }`}
                      >
                        <i aria-hidden="true" />
                        {user.status === "active" ? "正常" : "已封禁"}
                      </span>
                    </td>
                    <td className={styles.usersPage__date}>{formatDate(user.createdAt)}</td>
                    <td>
                      <div className={styles.usersPage__actions}>
                        <Link
                          className={styles.usersPage__iconButton}
                          href={`/admin/users/${user.id}`}
                          aria-label={`查看用户 ${user.username}`}
                          title="查看详情"
                        >
                          <Eye size={15} />
                        </Link>
                        <UserActions user={user} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.usersPage__empty}>没有匹配的用户</div>
        )}

        <footer className={styles.usersPage__footer}>
          <AppPagination current={page} pageSize={pageSize} total={userPage.total} />
        </footer>
      </section>
    </div>
  );
}
