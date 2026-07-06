import { getStore, nextId } from "@/server/mock-store";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  const { email } = (await request.json()) as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return jsonError("请先输入邮箱");
  }

  const token = `mock-slider-${nextId("slider")}`;
  getStore().sliderTokens.push({
    token,
    email: normalizedEmail,
    expiresAt: Date.now() + 5 * 60 * 1000,
    used: false,
  });

  return jsonOk({ token });
}
