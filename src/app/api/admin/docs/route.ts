import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { updateDocsConfig } from "@/server/bff/content";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/bff/mock-store";
import { parseJson } from "@/server/validation";

const docItemSchema = z.object({
  id: z.string().trim().min(1, "文档 ID 不能为空").max(128, "文档 ID 不能超过 128 个字符"),
  title: z.string().trim().min(1, "文档标题不能为空").max(120, "文档标题不能超过 120 个字符"),
  body: z.string().max(50_000, "单篇文档内容过长"),
});

const docGroupSchema = z.object({
  title: z.string().trim().min(1, "分组标题不能为空").max(120, "分组标题不能超过 120 个字符"),
  items: z.array(docItemSchema).max(100, "每个分组最多包含 100 篇文档"),
});

const docsSchema = z.object({
  title: z.string().trim().min(1, "请输入文档标题").max(120, "文档标题不能超过 120 个字符"),
  description: z.string().trim().max(500, "文档描述不能超过 500 个字符"),
  groups: z.array(docGroupSchema).max(50, "最多创建 50 个文档分组"),
});

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const parsed = await parseJson(request, docsSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const payload = parsed.data;

  const docs = await updateDocsConfig({
    title: payload.title,
    description: payload.description,
    groups: payload.groups,
  });

  addAuditLog({
    adminProfileId: current.profile.id,
    action: "update_docs",
    targetType: "docs",
    targetId: null,
    detailJson: { title: docs.title },
  });

  return jsonOk({ docs });
}
