import { getCurrentUserProfile } from "@/server/auth";
import { listAdminModels, saveAdminModel } from "@/server/bff/admin-models";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";
import { modelSchema } from "./schema";

async function getAdmin() {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return null;
  }
  return current;
}

export async function GET() {
  return handleApi(async () => {
    if (!(await getAdmin())) {
      return jsonError("无权限", 403);
    }

    const models = await listAdminModels();
    return jsonOk({ models });
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    if (!(await getAdmin())) {
      return jsonError("无权限", 403);
    }

    const parsed = await parseJson(request, modelSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const model = await saveAdminModel(null, parsed.data);
    return jsonOk({ model });
  });
}
