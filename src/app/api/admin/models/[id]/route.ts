import { getCurrentUserProfile } from "@/server/auth";
import { deleteAdminModel, saveAdminModel } from "@/server/bff/admin-models";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";
import { modelSchema } from "../schema";

async function isAdmin() {
  const current = await getCurrentUserProfile();
  return Boolean(current && current.profile.role === "admin");
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    if (!(await isAdmin())) {
      return jsonError("无权限", 403);
    }

    const params = await context.params;
    const parsed = await parseJson(request, modelSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const model = await saveAdminModel(params.id, parsed.data);
    return jsonOk({ model });
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    if (!(await isAdmin())) {
      return jsonError("无权限", 403);
    }

    const params = await context.params;
    await deleteAdminModel(params.id);
    return jsonOk({ ok: true });
  });
}
