import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { getStore } from "@/server/bff/mock-store";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";
import { parseForm } from "@/server/validation";

const profileSchema = z.object({
  username: z.string().trim().min(2, "用户名至少 2 位").max(32, "用户名最多 32 位"),
  bio: z.string().trim().max(200, "个人简介最多 200 位"),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const parsed = await parseForm(request, profileSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    if (isJavaAuthEnabled()) {
      const headers = new Headers(request.headers);
      headers.set("Content-Type", "application/json");
      const javaRequest = new Request(request.url, {
        method: "PUT",
        headers,
        body: JSON.stringify(parsed.data),
      });
      return proxyRequestToJavaApi(javaRequest, "/auth/user/profile");
    }

    const { username, bio } = parsed.data;
    const profile = getStore().profiles.find((item) => item.id === current.profile.id)!;
    profile.username = username;
    profile.bio = bio;

    return jsonOk({ ok: true });
  });
}
