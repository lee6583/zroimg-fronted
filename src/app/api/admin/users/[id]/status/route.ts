import { getCurrentUserProfile } from "@/server/auth";
import { addAuditLog, getStore } from "@/server/mock-store";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const { id } = await context.params;
  const { status } = (await request.json()) as { status?: "active" | "banned" };
  if (status !== "active" && status !== "banned") {
    return jsonError("状态不合法");
  }

  const profile = getStore().profiles.find((item) => item.id === id);
  if (!profile) {
    return jsonError("用户不存在", 404);
  }

  profile.status = status;
  addAuditLog({
    adminProfileId: current.profile.id,
    action: "update_user_status",
    targetType: "userProfile",
    targetId: id,
    detailJson: { status },
  });

  return jsonOk({ status });
}
