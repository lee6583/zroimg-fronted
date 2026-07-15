import { z } from "zod";
import { MOCK_SESSION_COOKIE } from "@/server/auth";
import { clearAuthRateLimit, consumeAuthRateLimit } from "@/server/auth-rate-limit";
import { findUserByEmail } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .email("邮箱格式不正确")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1, "请输入密码").max(128, "密码格式不正确"),
});

export async function POST(request: Request) {
  const parsed = await parseJson(request.clone(), signInSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const { email, password } = parsed.data;
  const limit = consumeAuthRateLimit(request, "user-login", email);
  if (!limit.ok) {
    return jsonError(`登录请求过于频繁，请 ${limit.retryAfterSeconds} 秒后再试`, 429);
  }

  if (isJavaAuthEnabled()) {
    return proxyRequestToJavaApi(request, "/auth/user/sign-in");
  }

  const bundle = findUserByEmail(email);
  if (!bundle || bundle.user.password !== password) {
    return jsonError("邮箱或密码错误", 401);
  }
  if (bundle.profile.status !== "active") {
    return jsonError("账号已被禁用", 403);
  }

  clearAuthRateLimit(request, "user-login", email);

  const response = jsonOk({
    message: "登录成功",
    user: {
      id: bundle.user.id,
      username: bundle.profile.username,
      email: bundle.user.email,
      role: bundle.profile.role,
    },
  });
  response.cookies.set(MOCK_SESSION_COOKIE, bundle.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
