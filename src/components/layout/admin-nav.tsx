"use client";

import clsx from "clsx";
import {
  Activity,
  Coins,
  FileText,
  Images,
  LayoutDashboard,
  MessageSquareText,
  ReceiptText,
  Settings,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import styles from "./shell.module.css";

const adminNavItems = [
  { label: "概览", href: "/admin", icon: LayoutDashboard },
  { label: "用户管理", href: "/admin/users", icon: Users },
  { label: "订单管理", href: "/admin/orders", icon: ReceiptText },
  { label: "积分套餐", href: "/admin/packages", icon: Coins },
  { label: "模型配置", href: "/admin/models", icon: SlidersHorizontal },
  { label: "生成任务", href: "/admin/generations", icon: Activity },
  { label: "画廊审核", href: "/admin/gallery", icon: Images },
  { label: "意见反馈", href: "/admin/tickets", icon: MessageSquareText },
  { label: "文档管理", href: "/admin/docs", icon: FileText },
  { label: "系统设置", href: "/admin/settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className={styles.shell__nav}>
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = isActivePath(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={clsx(styles.shell__navLink, isActive && styles.shell__navLinkActive)}
            onFocus={() => router.prefetch(item.href)}
            onPointerEnter={() => router.prefetch(item.href)}
          >
            <span className={clsx(styles.shell__navIcon, isActive && styles.shell__navIconActive)}>
              <Icon size={16} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
