import { z } from "zod";
import { getStore, nextId } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseJson } from "@/server/validation";

const sliderSchema = z.object({
  email: z
    .string()
    .trim()
    .email("邮箱格式不正确")
    .transform((value) => value.toLowerCase()),
  scene: z.literal("register"),
  challengeId: z.string().trim().min(1).max(64),
  positionRatio: z.number().min(0).max(1),
  durationMs: z.number().int().min(250).max(120000),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    if (isJavaAuthEnabled()) {
      return proxyRequestToJavaApi(request, "/auth/user/slider-token");
    }

    const parsed = await parseJson(request, sliderSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const { email, scene, challengeId, positionRatio, durationMs } = parsed.data;
    const store = getStore();
    const challenge = store.sliderChallenges.find((item) => {
      return item.id === challengeId && item.email === email && item.scene === scene;
    });
    const challengeExpired = !challenge || challenge.expiresAt < Date.now();
    const positionMatched = Boolean(
      challenge && Math.abs(challenge.targetRatio - positionRatio) <= 0.06,
    );
    const durationValid = durationMs >= 250 && durationMs <= 120000;

    store.sliderChallenges = store.sliderChallenges.filter((item) => item.id !== challengeId);

    if (challengeExpired || !positionMatched || !durationValid) {
      return jsonError("滑块验证未通过，请重新验证", 400);
    }

    const sliderToken = `mock-slider-${nextId("slider")}`;
    store.sliderTokens.push({
      token: sliderToken,
      email,
      expiresAt: Date.now() + 5 * 60 * 1000,
      used: false,
    });

    return jsonOk({ sliderToken });
  });
}
