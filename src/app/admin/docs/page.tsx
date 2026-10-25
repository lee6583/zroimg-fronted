import { ExternalLink } from "lucide-react";
import Link from "next/link";
import workspace from "@/features/admin/admin-workspace.module.css";
import { DocsSettingsForm } from "@/features/admin/docs-settings-form";
import { requestJava } from "@/server/java-api";
import type { DocsConfig } from "@/types/admin";
import { defaultDocs } from "./default-docs";

export const dynamic = "force-dynamic";

export default async function AdminDocsPage() {
  // Java 未保存过文档时返回空对象，此时用默认模板。
  const savedDocs = await requestJava<Partial<DocsConfig>>("/admin/settings/docs");
  const hasSavedDocs = Boolean(savedDocs.title) && Array.isArray(savedDocs.groups);

  let docs = defaultDocs;
  if (hasSavedDocs) {
    docs = savedDocs as DocsConfig;
  }

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

      <DocsSettingsForm initialDocs={docs} defaultDocs={defaultDocs} />
    </div>
  );
}
