import { getStore, nextId } from "@/server/mock-store";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return jsonError("请输入邮箱");
  }

  const store = getStore();
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
    message: "开发环境验证码固定为 123456",
    code,
  });
}
