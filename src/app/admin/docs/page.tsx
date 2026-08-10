import Link from "next/link";
import { DocsSettingsForm } from "@/features/admin/docs-settings-form";
import { defaultDocsConfig, getDocsConfig } from "@/server/bff/content";

export const dynamic = "force-dynamic";

export default async function AdminDocsPage() {
  const docs = await getDocsConfig();

  return (
    <div className="grid gap-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">文档管理</h1>
        </div>
        <Link href="/docs" className="btn-secondary" target="_blank">
          预览文档
        </Link>
      </section>

      <DocsSettingsForm initialDocs={docs} defaultDocs={defaultDocsConfig} />
    </div>
  );
}
