import { getCurrentUserProfile } from "@/server/auth";
import { getStore } from "@/server/mock-store";
import { jsonError, jsonOk } from "@/server/http";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const formData = await request.formData();
  const username = String(formData.get("username") || "").trim();
  const bio = String(formData.get("bio") || "").trim();

  if (!username) {
    return jsonError("用户名不能为空");
  }

  const profile = getStore().profiles.find((item) => item.id === current.profile.id)!;
  profile.username = username;
  profile.bio = bio;

  return jsonOk({ ok: true });
}
