import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { getStore } from "@/server/bff/mock-store";
import { jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "请输入当前密码").max(128),
    newPassword: z.string().min(8, "新密码至少 8 位").max(128),
    confirmPassword: z.string().min(1, "请确认新密码").max(128),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const parsed = await parseJson(request, passwordSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const payload = parsed.data;

  const user = getStore().users.find((item) => item.id === current.user.id)!;
  if (user.password !== payload.currentPassword) {
    return jsonError("当前密码错误");
  }
  user.password = payload.newPassword;
  return jsonOk({ ok: true });
}
