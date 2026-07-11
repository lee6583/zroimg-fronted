import { z } from "zod";
import { getStore, nextId } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const sendCodeSchema = z.object({
  email: z
    .string()
    .trim()
    .email("邮箱格式不正确")
    .transform((value) => value.toLowerCase()),
  sliderToken: z.string().trim().min(1, "请先完成安全验证").max(128, "安全验证格式不正确"),
});

export async function POST(request: Request) {
  if (isJavaAuthEnabled()) {
    return proxyRequestToJavaApi(request, "/auth/user/send-code");
  }

  const parsed = await parseJson(request, sendCodeSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const { email, sliderToken } = parsed.data;

  const store = getStore();
  const token = store.sliderTokens.find(
    (item) => item.token === sliderToken && item.email === email,
  );
  if (!token || token.used || token.expiresAt < Date.now()) {
    return jsonError("安全验证已失效，请重新完成滑块验证", 401);
  }

  token.used = true;

  // Mock 环境下固定验证码，方便在 Java 后端未接通前继续联调注册流程。
  const code = "123456";
  store.verificationCodes = store.verificationCodes.filter((item) => item.email !== email);
  store.verificationCodes.push({
    id: nextId("verification"),
    email,
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
