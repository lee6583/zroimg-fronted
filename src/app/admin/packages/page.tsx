import { PackageManager } from "@/features/admin/package-manager";
import { requestJava } from "@/server/java-api";
import type { AdminPackage } from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await requestJava<AdminPackage[]>("/order/admin/packages");

  return <PackageManager initialPackages={packages} />;
}
