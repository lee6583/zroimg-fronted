import { AdminShell } from "@/components/layout/admin-shell";
import { PackageManager } from "@/features/admin/package-manager";
import { requireAdmin } from "@/server/auth";
import { listAdminCreditPackages } from "@/server/bff/orders";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  await requireAdmin();
  const packages = await listAdminCreditPackages();

  return (
    <AdminShell active="packages">
      <div className="grid gap-6">
        <section>
          <h1 className="page-title">积分套餐</h1>
        </section>
        <PackageManager initialPackages={packages} />
      </div>
    </AdminShell>
  );
}
