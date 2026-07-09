import { createMockUser, findUserByEmail, getStore } from "@/server/bff/mock-store";
import { jsonError, jsonOk } from "@/server/http";
import { hasJavaApiBaseUrl, isJavaUnavailableResponse, proxyRequestToJavaApi } from "@/server/java-api";

export async function POST(request: Request) {
  if (hasJavaApiBaseUrl()) {
    const response = await proxyRequestToJavaApi(request.clone(), "/auth/user/register");
    if (!isJavaUnavailableResponse(response)) {
      return response;
    }
  }

  const payload = (await request.json()) as {
    username?: string;
    email?: string;
    password?: string;
    code?: string;
  };

  const username = payload.username?.trim() || "";
  const email = payload.email?.trim().toLowerCase() || "";
  const password = payload.password?.trim() || "";
  const code = payload.code?.trim() || "";

  if (!username || !email || !password || !code) {
    return jsonError("请完整填写注册信息");
  }
  if (password.length < 6) {
    return jsonError("密码至少 6 位");
  }
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
