import type { Metadata } from "next";
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { AdminShell } from "@/components/layout/admin-shell";
import { RootDocument } from "@/components/layout/root-document";
import { IntlErrorHandlingProvider } from "@/i18n/intl-error-handling-provider";
import { noindexRobots, siteIcons } from "@/lib/seo";
import { requireAdmin } from "@/server/auth";

// 后台是独立根布局：只有中文、不进入 [locale]、不被收录。
// 共享的导航组件（顶栏、账户菜单）依赖 next-intl，这里同样提供 zh-CN 文案（i18n/request.ts 对无 [locale] 的路由回退到 zh-CN）。
export const metadata: Metadata = {
  title: {
    default: "管理后台 | ZroImg",
    template: "%s | ZroImg 管理后台",
  },
  icons: siteIcons,
  robots: noindexRobots,
};

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout(props: AdminLayoutProps) {
  await requireAdmin();

  return (
    <RootDocument lang="zh-CN">
      <NextIntlClientProvider>
        <IntlErrorHandlingProvider>
          <AdminShell>{props.children}</AdminShell>
        </IntlErrorHandlingProvider>
      </NextIntlClientProvider>
    </RootDocument>
  );
}
