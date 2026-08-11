import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { updateEasyPaySettings } from "@/server/bff/account";
import { addAuditLog } from "@/server/bff/audit";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { httpUrlSchema, optionalHttpUrlSchema, parseJson } from "@/server/validation";

const settingsSchema = z
  .object({
    enabled: z.boolean(),
    apiBase: optionalHttpUrlSchema,
    pid: z.string().trim().max(128),
    key: z.string().trim().max(4096),
    clearKey: z.boolean(),
    notifyUrl: httpUrlSchema,
    returnUrl: httpUrlSchema,
    feeRatePercent: z.number().min(0).max(30).multipleOf(0.01),
    timeoutMinutes: z.number().int().min(1).max(1440),
    creditsPerYuan: z.number().int().min(1).max(10_000),
    maxPendingOrders: z.number().int().min(1).max(20),
    minAmountCent: z.number().int().min(1).max(100_000_000),
    maxAmountCent: z.number().int().min(1).max(100_000_000),
  })
  .refine((settings) => settings.minAmountCent <= settings.maxAmountCent, {
    message: "最低充值金额不能高于最高充值金额",
    path: ["maxAmountCent"],
  });

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current || current.profile.role !== "admin") {
      return jsonError("无权限", 403);
    }

    const parsed = await parseJson(request, settingsSchema);
    if (!parsed.ok) return jsonError(parsed.message);

    const payload = parsed.data;
    const settings = await updateEasyPaySettings({
      enabled: payload.enabled,
      apiBase: payload.apiBase,
      pid: payload.pid,
      key: payload.key,
      clearKey: payload.clearKey,
      notifyUrl: payload.notifyUrl,
      returnUrl: payload.returnUrl,
      feeRatePercent: payload.feeRatePercent,
      timeoutMinutes: payload.timeoutMinutes,
      creditsPerYuan: payload.creditsPerYuan,
      maxPendingOrders: payload.maxPendingOrders,
      minAmountCent: payload.minAmountCent,
      maxAmountCent: payload.maxAmountCent,
    });

    addAuditLog({
      adminProfileId: current.profile.id,
      action: "update_easypay_settings",
      targetType: "systemSetting",
      targetId: "easypay",
      detailJson: {
        enabled: settings.enabled,
        apiBase: settings.apiBase,
        feeRatePercent: settings.feeRatePercent,
        timeoutMinutes: settings.timeoutMinutes,
        creditsPerYuan: settings.creditsPerYuan,
        maxPendingOrders: settings.maxPendingOrders,
        minAmountCent: settings.minAmountCent,
        maxAmountCent: settings.maxAmountCent,
      },
    });

    return jsonOk({ settings });
  });
}
