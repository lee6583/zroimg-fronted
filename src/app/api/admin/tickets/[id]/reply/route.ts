import { getCurrentUserProfile } from "@/server/auth";
import { addFeedbackMessage } from "@/server/bff/account";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/bff/mock-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const { id } = await context.params;
  const { body } = (await request.json()) as { body?: string };
  if (!body?.trim()) {
    return jsonError("请输入回复内容");
  }

  try {
    await addFeedbackMessage({
      ticketId: id,
      authorProfileId: current.profile.id,
      isAdmin: true,
      body,
    });
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "reply_ticket",
      targetType: "feedbackTicket",
      targetId: id,
      detailJson: { bodyLength: body.trim().length },
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "回复失败");
  }
}
