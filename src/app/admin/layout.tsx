import type { ReactNode } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/server/auth";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout(props: AdminLayoutProps) {
  await requireAdmin();
  return <AdminShell>{props.children}</AdminShell>;
}
