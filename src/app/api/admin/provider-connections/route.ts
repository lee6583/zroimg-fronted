import { getCurrentUserProfile } from "@/server/auth";
import { listProviderConnections, saveProviderConnection } from "@/server/bff/admin-models";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";
import { connectionSchema } from "./schema";

async function isAdmin() {
  const current = await getCurrentUserProfile();
  return Boolean(current && current.profile.role === "admin");
}

export async function GET() {
  return handleApi(async () => {
    if (!(await isAdmin())) {
      return jsonError("无权限", 403);
    }

    const connections = await listProviderConnections();
    return jsonOk({ connections });
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    if (!(await isAdmin())) {
      return jsonError("无权限", 403);
    }

    const parsed = await parseJson(request, connectionSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const connection = await saveProviderConnection(null, parsed.data);
    return jsonOk({ connection });
  });
}
