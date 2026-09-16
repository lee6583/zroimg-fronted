import { ExternalLink } from "lucide-react";
import Link from "next/link";
import workspace from "@/features/admin/admin-workspace.module.css";
import { DocsSettingsForm } from "@/features/admin/docs-settings-form";
import { defaultDocsConfig, getDocsConfig } from "@/server/bff/content";

export const dynamic = "force-dynamic";

export default async function AdminDocsPage() {
  const docs = await getDocsConfig();

  return (
    <div className={workspace.workspace}>
      <header className={workspace.header}>
        <div className={workspace.headerCopy}>
          <h1 className="page-title">文档管理</h1>
        </div>
        <Link href="/docs" className={workspace.secondaryAction} target="_blank" rel="noreferrer">
          <ExternalLink size={14} aria-hidden="true" />
          预览文档
        </Link>
      </header>

      <DocsSettingsForm initialDocs={docs} defaultDocs={defaultDocsConfig} />
    </div>
  );
}
