import { NextResponse } from "next/server";
import { MOCK_SESSION_COOKIE } from "@/server/auth";
import { findUserByEmail, getStore } from "@/server/mock-store";
import { jsonError } from "@/server/http";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    email?: string;
    password?: string;
    sliderToken?: string;
  };

  const email = payload.email?.trim().toLowerCase() || "";
  const password = payload.password?.trim() || "";
  const sliderToken = payload.sliderToken?.trim() || "";

  if (!email || !password || !sliderToken) {
    return jsonError("请完整填写登录信息", 400);
  }

  const store = getStore();
  const token = store.sliderTokens.find((item) => item.token === sliderToken && item.email === email);
  if (!token || token.used || token.expiresAt < Date.now()) {
    return jsonError("安全验证已失效，请重新完成滑块验证", 401);
  }

  const bundle = findUserByEmail(email);
  if (!bundle || bundle.user.password !== password) {
    return jsonError("邮箱或密码错误", 401);
  }
  if (bundle.profile.status !== "active") {
    return jsonError("账号已被禁用", 403);
  }

  token.used = true;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(MOCK_SESSION_COOKIE, bundle.user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
