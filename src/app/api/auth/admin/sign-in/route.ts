import { z } from "zod";
import { MOCK_SESSION_COOKIE } from "@/server/auth";
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
  if (isJavaAuthEnabled()) {
    return proxyRequestToJavaApi(request, "/auth/admin/sign-in");
  }

  const parsed = await parseJson(request, signInSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const { email, password } = parsed.data;

  const bundle = findUserByEmail(email);
  if (!bundle || bundle.user.password !== password) {
    return jsonError("邮箱或密码错误", 401);
  }
  if (bundle.profile.role !== "admin") {
    return jsonError("无管理员权限", 403);
  }
  if (bundle.profile.status !== "active") {
    return jsonError("账号已被禁用", 403);
  }

  const response = jsonOk({ ok: true as const });
  response.cookies.set(MOCK_SESSION_COOKIE, bundle.user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
