import { getCurrentUserProfile } from "@/server/auth";
import { jsonError, jsonOk } from "@/server/http";
import { uploadMedia } from "@/server/bff/generation";

export async function POST(request: Request) {
  const current = await getCurrentUserProfile();
  if (!current) {
    return jsonError("请先登录", 401);
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return jsonError("请选择文件");
  }

  const media = await uploadMedia({
    ownerUserProfileId: current.profile.id,
    fileName: file.name,
    kind: kind === "output" ? "output" : "input",
  });

  return jsonOk({
    media: {
      id: media.id,
      fileName: media.fileName,
      kind: media.kind,
    },
  });
}
