import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { updateDocsConfig } from "@/server/bff/content";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/bff/mock-store";
import { parseJson } from "@/server/validation";

const docsSchema = z.object({
  title: z.string().trim().min(1, "请输入文档标题").max(120),
  description: z.string().trim().max(500),
  groups: z
    .array(
      z.object({
        title: z.string().trim().min(1, "分组标题不能为空").max(120),
        items: z
          .array(
            z.object({
              id: z.string().trim().min(1, "文档 ID 不能为空").max(128),
              title: z.string().trim().min(1, "文档标题不能为空").max(120),
              body: z.string().max(50_000, "单篇文档内容过长"),
            }),
          )
          .max(100),
      }),
    )
    .max(50),
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
