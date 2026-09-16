import { getCurrentUserProfile } from "@/server/auth";
import { deleteProviderConnection, saveProviderConnection } from "@/server/bff/admin-models";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";
import { connectionSchema } from "../schema";

async function isAdmin() {
  const current = await getCurrentUserProfile();
  return Boolean(current && current.profile.role === "admin");
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    if (!(await isAdmin())) {
      return jsonError("无权限", 403);
    }

    const parsed = await parseJson(request, connectionSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const { id } = await context.params;
    const connection = await saveProviderConnection(id, parsed.data);
    return jsonOk({ connection });
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  return handleApi(async () => {
    if (!(await isAdmin())) {
      return jsonError("无权限", 403);
    }

    const { id } = await context.params;
    await deleteProviderConnection(id);
    return jsonOk({ ok: true });
  });
}
