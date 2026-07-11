import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { updateTicketStatus } from "@/server/bff/account";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { addAuditLog } from "@/server/bff/mock-store";
import { parseJson } from "@/server/validation";

const statusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, statusSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const { status } = parsed.data;

    await updateTicketStatus(id, status);
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "update_ticket_status",
      targetType: "feedbackTicket",
      targetId: id,
      detailJson: { status },
    });
    return jsonOk({ ok: true });
  });
}
