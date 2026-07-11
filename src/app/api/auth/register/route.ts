import { z } from "zod";
import { createMockUser, findUserByEmail, getStore } from "@/server/bff/mock-store";
import { isMockBffEnabled } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const registerSchema = z.object({
  username: z.string().trim().min(2, "用户名至少 2 位").max(32, "用户名最多 32 位"),
  email: z
    .string()
    .trim()
    .email("邮箱格式不正确")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, "密码至少 8 位").max(128, "密码最多 128 位"),
  code: z.string().trim().min(1, "请输入验证码").max(12, "验证码格式不正确"),
});

export async function POST(request: Request) {
  if (!isMockBffEnabled()) {
    return proxyRequestToJavaApi(request, "/auth/user/register");
  }

  const parsed = await parseJson(request, registerSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const { username, email, password, code } = parsed.data;
  if (findUserByEmail(email)) {
    return jsonError("该邮箱已注册");
  }

  const store = getStore();
  const verification = store.verificationCodes.find((item) => item.email === email);
  if (!verification || verification.expiresAt < Date.now()) {
    return jsonError("验证码已过期，请重新获取");
  }
  if (verification.code !== code) {
    return jsonError("验证码错误");
  }

  createMockUser({ username, email, password });
  store.verificationCodes = store.verificationCodes.filter((item) => item.id !== verification.id);

  return jsonOk({
    ok: true,
    message: "注册成功",
  });
}
