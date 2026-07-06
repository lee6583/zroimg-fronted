import { getCurrentUserProfile } from "@/server/auth";
import { addFeedbackMessage } from "@/server/feedback";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const { id } = await context.params;
  const { body } = (await request.json()) as { body?: string };

  if (!body?.trim()) {
    return jsonError("请输入追问内容");
  }

  try {
    await addFeedbackMessage({
      ticketId: id,
      authorProfileId: current.profile.id,
      isAdmin: false,
      body,
    });
    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "发送失败");
  }
}
