import type { ReactNode } from "react";
import Link from "next/link";
import {
  Activity,
  FileClock,
  FileText,
  LayoutDashboard,
  MessageSquareText,
  ReceiptText,
  Settings,
  Users,
} from "lucide-react";
import { ProductTopNav } from "@/components/product-top-nav";
import styles from "./shell.module.css";

type AdminSection = "overview" | "users" | "orders" | "generations" | "tickets" | "docs" | "settings" | "audit";

const adminNavItems: Array<{
  key: AdminSection;
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
}> = [
  { key: "overview", label: "概览", href: "/admin", icon: LayoutDashboard },
  { key: "users", label: "用户管理", href: "/admin/users", icon: Users },
  { key: "orders", label: "订单管理", href: "/admin/orders", icon: ReceiptText },
  { key: "generations", label: "生成任务", href: "/admin/generations", icon: Activity },
  { key: "tickets", label: "意见反馈", href: "/admin/tickets", icon: MessageSquareText },
  { key: "docs", label: "文档管理", href: "/admin/docs", icon: FileText },
  { key: "settings", label: "系统设置", href: "/admin/settings", icon: Settings },
  { key: "audit", label: "审计日志", href: "/admin/audit-logs", icon: FileClock },
];

function joinClassNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export async function AdminShell({
  active,
  children,
}: {
  active: AdminSection;
  children: ReactNode;
}) {
  return (
    <>
      <ProductTopNav />
      <div className={styles.shell}>
        <div className={styles.shell__grid}>
          <aside className={styles.shell__sidebar}>
            <div className={styles.shell__sidebarInner}>
              <div className={styles.shell__adminHeader}>
                <p className="label">Admin</p>
                <h2 className={styles.shell__adminTitle}>管理后台</h2>
              </div>
              <nav className={styles.shell__nav}>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = active === item.key;
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={joinClassNames(
                        styles.shell__navLink,
                        isActive && styles.shell__navLinkActive,
                      )}
                    >
                      <span
                        className={joinClassNames(
                          styles.shell__navIcon,
                          isActive && styles.shell__navIconActive,
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
          <main className={styles.shell__main}>{children}</main>
        </div>
      </div>
    </>
  );
}
