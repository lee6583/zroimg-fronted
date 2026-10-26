import { PackageManager } from "@/features/admin/package-manager";
import { requireAdmin } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { AdminPackage } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  await requireAdmin();
  const packages = await requestJava<AdminPackage[]>("/order/admin/packages");

  return <PackageManager initialPackages={packages} />;
}
