import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/bff/orders";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  await requireAdmin();
  const logs = await prisma.adminAuditLog.findMany({
    include: { admin: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <AdminShell active="audit">
      <div className="grid gap-6">
        <section>
          <h1 className="page-title">审计日志</h1>
        </section>
        <div className="mt-6 grid gap-2">
          {logs.map((log) => (
            <div key={log.id} className="surface rounded-xl p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <p className="font-semibold">{log.action}</p>
                <p className="text-sm text-muted">{log.admin?.user?.email || "-"}</p>
              </div>
              <p className="mt-1 text-xs text-muted">
                {log.targetType} / {log.targetId || "-"}
              </p>
              <p className="mt-2 overflow-x-auto font-mono text-xs text-muted">
                {JSON.stringify(log.detailJson)}
              </p>
            </div>
          ))}
          {logs.length === 0 ? (
            <p className="surface rounded-xl p-8 text-center text-sm text-muted">暂无审计日志</p>
          ) : null}
        </div>
      </div>
    </AdminShell>
  );
}
