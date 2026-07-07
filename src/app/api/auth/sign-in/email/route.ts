import { NextResponse } from "next/server";
import { MOCK_SESSION_COOKIE } from "@/server/auth";
import { findUserByEmail } from "@/server/bff/mock-store";
import { jsonError } from "@/server/http";
import { hasJavaApiBaseUrl, isJavaUnavailableResponse, proxyRequestToJavaApi } from "@/server/java-api";

export async function POST(request: Request) {
  if (hasJavaApiBaseUrl()) {
    const response = await proxyRequestToJavaApi(request.clone(), "/auth/sign-in/email");
    if (!isJavaUnavailableResponse(response)) {
      return response;
    }
  }

  const payload = (await request.json()) as {
    email?: string;
    password?: string;
  };

  const email = payload.email?.trim().toLowerCase() || "";
  const password = payload.password?.trim() || "";

  if (!email || !password) {
    return jsonError("请完整填写登录信息", 400);
  }

  const bundle = findUserByEmail(email);
  if (!bundle || bundle.user.password !== password) {
    return jsonError("邮箱或密码错误", 401);
  }
  if (bundle.profile.status !== "active") {
    return jsonError("账号已被禁用", 403);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MOCK_SESSION_COOKIE, bundle.user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
