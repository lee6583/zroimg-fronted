import { z } from "zod";
import { getStore, nextId } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const challengeSchema = z.object({
  email: z
    .string()
    .trim()
    .email("邮箱格式不正确")
    .transform((value) => value.toLowerCase()),
  scene: z.literal("register"),
});

export async function POST(request: Request) {
  if (isJavaAuthEnabled()) {
    return proxyRequestToJavaApi(request, "/auth/user/slider-challenge");
  }

  return handleApi(async () => {
    const parsed = await parseJson(request, challengeSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const targetRatio = Math.round((0.45 + Math.random() * 0.4) * 100) / 100;
    const challengeId = `mock-slider-challenge-${nextId("slider-challenge")}`;
    const store = getStore();
    store.sliderChallenges = store.sliderChallenges.filter((item) => {
      return item.email !== parsed.data.email;
    });
    store.sliderChallenges.push({
      id: challengeId,
      email: parsed.data.email,
      scene: parsed.data.scene,
      targetRatio,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return jsonOk({ challengeId, targetRatio });
  });
}
