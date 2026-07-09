import { getStore, nextId } from "@/server/bff/mock-store";
import { jsonError, jsonOk } from "@/server/http";
import { hasJavaApiBaseUrl, isJavaUnavailableResponse, proxyRequestToJavaApi } from "@/server/java-api";

export async function POST(request: Request) {
  if (hasJavaApiBaseUrl()) {
    const response = await proxyRequestToJavaApi(request.clone(), "/auth/user/send-code");
    if (!isJavaUnavailableResponse(response)) {
      return response;
    }
  }

  const { email, sliderToken } = (await request.json()) as { email?: string; sliderToken?: string };
  const normalizedEmail = email?.trim().toLowerCase();
  const normalizedSliderToken = sliderToken?.trim() || "";

  if (!normalizedEmail) {
    return jsonError("请输入邮箱");
  }
  if (!normalizedSliderToken) {
    return jsonError("请先完成安全验证");
  }

  const store = getStore();
  const token = store.sliderTokens.find((item) => item.token === normalizedSliderToken && item.email === normalizedEmail);
  if (!token || token.used || token.expiresAt < Date.now()) {
    return jsonError("安全验证已失效，请重新完成滑块验证", 401);
  }

  token.used = true;

  // Mock 环境下固定验证码，方便在 Java 后端未接通前继续联调注册流程。
  const code = "123456";
  store.verificationCodes = store.verificationCodes.filter((item) => item.email !== normalizedEmail);
  store.verificationCodes.push({
    id: nextId("verification"),
    email: normalizedEmail,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return jsonOk({
    ok: true,
    message: "Mock 验证码固定为 123456",
    code,
    cooldownSeconds: 60,
    expiresInSeconds: 600,
  });
}
