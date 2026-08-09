import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { createAdminCreditPackage, listAdminCreditPackages } from "@/server/bff/orders";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const packageSchema = z.object({
  code: z.string().trim().min(1, "套餐编码不能为空").max(50),
  name: z.string().trim().min(1, "套餐名称不能为空").max(50),
  description: z.string().trim().max(255),
  amountCent: z.number().int().min(1, "套餐金额必须大于 0"),
  credits: z.number().int().min(1, "套餐积分必须大于 0"),
  highlights: z.array(z.string().trim().min(1)).min(1, "至少填写一个套餐亮点"),
  recommended: z.boolean(),
  enabled: z.boolean(),
  sort: z.number().int(),
});

async function requireAdmin() {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.role !== "admin") {
    return null;
  }

  return current;
}

export async function GET() {
  return handleApi(async () => {
    const current = await requireAdmin();
    if (!current) {
      return jsonError("无权限", 403);
    }

    const packages = await listAdminCreditPackages();
    return jsonOk({ packages });
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await requireAdmin();
    if (!current) {
      return jsonError("无权限", 403);
    }

    const parsed = await parseJson(request, packageSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const packageItem = await createAdminCreditPackage(parsed.data);
    return jsonOk({ package: packageItem });
  });
}
