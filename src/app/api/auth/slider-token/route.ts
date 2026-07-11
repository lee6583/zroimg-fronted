import { z } from "zod";
import { getStore, nextId } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const sliderSchema = z.object({
  email: z
    .string()
    .trim()
    .email("邮箱格式不正确")
    .transform((value) => value.toLowerCase()),
  scene: z.string().max(32).optional(),
});

export async function POST(request: Request) {
  if (isJavaAuthEnabled()) {
    return proxyRequestToJavaApi(request, "/auth/user/slider-token");
  }

  const parsed = await parseJson(request, sliderSchema);
  if (!parsed.ok) return jsonError(parsed.message);

  const { email } = parsed.data;

  const sliderToken = `mock-slider-${nextId("slider")}`;
  getStore().sliderTokens.push({
    token: sliderToken,
    email,
    expiresAt: Date.now() + 5 * 60 * 1000,
    used: false,
  });

  return jsonOk({ sliderToken });
}
