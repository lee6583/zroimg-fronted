import { z } from "zod";
import { findUserByEmail, getStore, nextId } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const sendCodeSchema = z.object({
  email: z
    .string()
    .trim()
    .email("邮箱格式不正确")
    .transform((value) => value.toLowerCase()),
});

export async function POST(request: Request) {
  if (isJavaAuthEnabled()) {
    return proxyRequestToJavaApi(request, "/auth/user/password-reset/send-code");
  }

  return handleApi(async () => {
    const parsed = await parseJson(request, sendCodeSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const { email } = parsed.data;
    const bundle = findUserByEmail(email);
    if (!bundle) {
      return jsonError("该邮箱尚未注册", 404);
    }

    const store = getStore();
    const code = "123456";
    store.verificationCodes = store.verificationCodes.filter((item) => item.email !== email);
    store.verificationCodes.push({
      id: nextId("verification"),
      email,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    return jsonOk({
      message: "Mock 验证码固定为 123456",
      code,
      cooldownSeconds: 60,
      expiresInSeconds: 600,
    });
  });
}
