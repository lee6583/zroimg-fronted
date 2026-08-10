import { PackageManager } from "@/features/admin/package-manager";
import { listAdminCreditPackages } from "@/server/bff/orders";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await listAdminCreditPackages();

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="page-title">积分套餐</h1>
      </section>
      <PackageManager initialPackages={packages} />
    </div>
  );
}
