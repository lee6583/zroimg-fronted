import { PackageManager } from "@/features/admin/package-manager";
import { listAdminCreditPackages } from "@/server/bff/orders";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await listAdminCreditPackages();

  return <PackageManager initialPackages={packages} />;
}
