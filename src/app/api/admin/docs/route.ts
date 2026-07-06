import { getCurrentUserProfile } from "@/server/auth";
import { getDocsConfig, updateDocsConfig } from "@/server/docs";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/mock-store";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const payload = (await request.json()) as {
    title?: string;
    description?: string;
    groups?: unknown;
  };

  if (!payload.title?.trim() || !Array.isArray(payload.groups)) {
    return jsonError("文档结构不完整");
  }

  const docs = await updateDocsConfig({
    title: payload.title.trim(),
    description: payload.description?.trim() || "",
    groups: payload.groups as Awaited<ReturnType<typeof getDocsConfig>>["groups"],
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
