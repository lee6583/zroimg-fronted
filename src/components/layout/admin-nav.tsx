"use client";

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
  ChartColumn,
  Megaphone,
  Sparkles,
  Wallet,
  Wrench,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { SideNav, type NavGroup } from "./side-nav";

const adminNavGroups: NavGroup[] = [
  {
    key: "overview",
    label: "概览",
    icon: LayoutDashboard,
    items: [{ key: "/admin", label: "数据总览", href: "/admin", icon: ChartColumn }],
  },
  {
    key: "trade",
    label: "用户与交易",
    icon: Wallet,
    items: [
      { key: "/admin/users", label: "用户管理", href: "/admin/users", icon: Users },
      { key: "/admin/orders", label: "订单管理", href: "/admin/orders", icon: ReceiptText },
      { key: "/admin/packages", label: "积分套餐", href: "/admin/packages", icon: Coins },
    ],
  },
  {
    key: "ai",
    label: "AI 生成",
    icon: Sparkles,
    items: [
      { key: "/admin/models", label: "模型配置", href: "/admin/models", icon: SlidersHorizontal },
      { key: "/admin/generations", label: "生成任务", href: "/admin/generations", icon: Activity },
    ],
  },
  {
    key: "content",
    label: "内容运营",
    icon: Megaphone,
    items: [
      { key: "/admin/gallery", label: "画廊审核", href: "/admin/gallery", icon: Images },
      { key: "/admin/docs", label: "文档管理", href: "/admin/docs", icon: FileText },
      { key: "/admin/tickets", label: "意见反馈", href: "/admin/tickets", icon: MessageSquareText },
    ],
  },
  {
    key: "system",
    label: "系统管理",
    icon: Wrench,
    items: [{ key: "/admin/settings", label: "系统设置", href: "/admin/settings", icon: Settings }],
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getActiveHref(pathname: string) {
  for (const group of adminNavGroups) {
    for (const item of group.items) {
      if (isActivePath(pathname, item.href)) return item.href;
    }
  }

  return null;
}

export function AdminNav() {
  const pathname = usePathname();
  const activeHref = getActiveHref(pathname);

  return <SideNav storageKey="zroimg.nav.admin" groups={adminNavGroups} activeKey={activeHref} />;
}
