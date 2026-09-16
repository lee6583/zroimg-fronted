import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { updateAnnouncementSettings } from "@/server/bff/account";
import { addAuditLog } from "@/server/bff/audit";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const announcementSchema = z.object({
  enabled: z.boolean(),
  title: z.string().trim().min(1, "请输入公告标题").max(60, "公告标题最多 60 个字符"),
  content: z.string().trim().min(1, "请输入公告内容").max(2000, "公告内容最多 2000 个字符"),
});

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const parsed = await parseJson(request, announcementSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const settings = await updateAnnouncementSettings(parsed.data);
    addAuditLog({
      adminProfileId: current.profile.id,
      action: "update_announcement_settings",
      targetType: "systemSetting",
      targetId: "announcement",
      detailJson: { enabled: settings.enabled, title: settings.title },
    });

    return jsonOk({ settings });
  });
}
