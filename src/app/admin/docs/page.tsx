import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { DocsSettingsForm } from "@/features/admin/docs-settings-form";
import { requireAdmin } from "@/server/auth";
import { defaultDocsConfig, getDocsConfig } from "@/server/bff/content";

export const dynamic = "force-dynamic";

export default async function AdminDocsPage() {
  await requireAdmin();
  const docs = await getDocsConfig();

  return (
    <AdminShell active="docs">
      <div className="grid gap-6">
        <section className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label">Documentation</p>
            <h1 className="page-title">文档管理</h1>
            <p className="page-description max-w-2xl">
              编辑公开文档页展示的站点介绍、快速开始、图片生成说明和账户帮助内容。
            </p>
          </div>
          <Link href="/docs" className="btn-secondary" target="_blank">
            预览文档
          </Link>
        </section>

        <DocsSettingsForm initialDocs={docs} defaultDocs={defaultDocsConfig} />
      </div>
    </AdminShell>
  );
}
