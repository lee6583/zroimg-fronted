import { getCurrentUserProfile } from "@/server/auth";
import { getStore } from "@/server/bff/mock-store";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const payload = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };

  const user = getStore().users.find((item) => item.id === current.user.id)!;
  if (user.password !== payload.currentPassword) {
    return jsonError("当前密码错误");
  }
  if (!payload.newPassword || payload.newPassword.length < 8) {
    return jsonError("新密码至少 8 位");
  }
  if (payload.newPassword !== payload.confirmPassword) {
    return jsonError("两次输入的新密码不一致");
  }

  user.password = payload.newPassword;
  return jsonOk({ ok: true });
}
