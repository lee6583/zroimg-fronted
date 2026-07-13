import { z } from "zod";
import { findUserByEmail, getStore } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const resetSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email("邮箱格式不正确")
      .transform((value) => value.toLowerCase()),
    code: z.string().trim().min(1, "请输入验证码").max(12, "验证码格式不正确"),
    password: z.string().min(8, "密码至少 8 位").max(128, "密码最多 128 位"),
    confirmPassword: z.string().min(8, "确认密码至少 8 位").max(128, "确认密码最多 128 位"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  if (isJavaAuthEnabled()) {
    return proxyRequestToJavaApi(request, "/auth/user/reset-password");
  }

  return handleApi(async () => {
    const parsed = await parseJson(request, resetSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const { email, code, password } = parsed.data;
    const bundle = findUserByEmail(email);
    if (!bundle) {
      return jsonError("该邮箱尚未注册", 404);
    }

    const store = getStore();
    const verification = store.verificationCodes.find((item) => item.email === email);
    if (!verification || verification.expiresAt < Date.now()) {
      return jsonError("验证码已过期，请重新获取");
    }
    if (verification.code !== code) {
      return jsonError("验证码错误");
    }

    bundle.user.password = password;
    store.verificationCodes = store.verificationCodes.filter((item) => item.id !== verification.id);

    return jsonOk({
      message: "密码已重置，请使用新密码登录",
    });
  });
}
