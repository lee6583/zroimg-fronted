import { getStore, nextId } from "@/server/bff/mock-store";
import { jsonError, jsonOk } from "@/server/http";
import { hasJavaApiBaseUrl, proxyRequestToJavaApi } from "@/server/java-api";

export async function POST(request: Request) {
  if (hasJavaApiBaseUrl()) {
    return proxyRequestToJavaApi(request, "/auth/slider-token");
  }

  const { email } = (await request.json()) as { email?: string; scene?: string };
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
