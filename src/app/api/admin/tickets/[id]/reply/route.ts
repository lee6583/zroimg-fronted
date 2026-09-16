import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { replyTicketAsAdmin } from "@/server/bff/account";
import { addAuditLog } from "@/server/bff/audit";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const replySchema = z.object({
  body: z.string().trim().min(1, "请输入回复内容").max(5000, "回复最多 5000 位"),
  status: z.enum(["open", "in_progress", "resolved"]),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, replySchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const { body, status } = parsed.data;

    await replyTicketAsAdmin({
      ticketId: id,
      authorProfileId: current.profile.id,
      isAdmin: true,
      body,
      status,
    });
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "reply_ticket",
      targetType: "feedbackTicket",
      targetId: id,
      detailJson: { bodyLength: body.trim().length, status },
    });
    return jsonOk({ ok: true });
  });
}
