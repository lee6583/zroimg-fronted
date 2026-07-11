import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { addTicketMessage } from "@/server/bff/account";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const messageSchema = z.object({
  body: z.string().trim().min(1, "请输入追问内容").max(5000, "回复最多 5000 位"),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const { id } = await context.params;
    const parsed = await parseJson(request, messageSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    await addTicketMessage({
      ticketId: id,
      authorProfileId: current.profile.id,
      isAdmin: false,
      body: parsed.data.body,
    });
    return jsonOk({ ok: true });
  });
}
