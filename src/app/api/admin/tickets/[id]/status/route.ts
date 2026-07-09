import { getErrorMessage } from "@/utils/error";
import { getCurrentUserProfile } from "@/server/auth";
import { updateFeedbackTicketStatus } from "@/server/bff/account";
import { jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/bff/mock-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return jsonError("无权限", 403);
  }

  const { id } = await context.params;
  const { status } = (await request.json()) as {
    status?: "open" | "in_progress" | "resolved" | "closed";
  };
  if (!status) {
    return jsonError("请选择状态");
  }

  try {
    await updateFeedbackTicketStatus(id, status);
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "update_ticket_status",
      targetType: "feedbackTicket",
      targetId: id,
      detailJson: { status },
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(getErrorMessage(error));
  }
}
