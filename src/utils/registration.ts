// 与 Java AdminSettingsService.RegistrationSettings 的范围保持一致
export const registerRewardPointsRange = { min: 0, max: 1_000_000 } as const;

// Java AuthUserController.RegisterConfigVO（GET /auth/user/register-config）
export type RegisterConfig = {
  registrationEnabled: boolean;
  rewardPoints: number;
};

// 接口不可用时：保持可注册（后端仍会做最终校验），不展示赠送积分，避免显示错误数字。
export const fallbackRegisterConfig: RegisterConfig = {
  registrationEnabled: true,
  rewardPoints: 0,
};

export function normalizeRegisterConfig(raw: unknown): RegisterConfig {
  if (!raw || typeof raw !== "object") {
    return fallbackRegisterConfig;
  }

  const value = raw as Partial<Record<keyof RegisterConfig, unknown>>;
  const points = value.rewardPoints;
  const rewardPoints =
    typeof points === "number" && Number.isInteger(points) && points > 0 ? points : 0;

  return {
    registrationEnabled: value.registrationEnabled !== false,
    rewardPoints,
  };
}

/** 后台输入框的值 -> 合法积分；非整数或越界返回 null。 */
export function parseRewardPointsInput(input: string) {
  const text = input.trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }

  const points = Number(text);
  if (points < registerRewardPointsRange.min || points > registerRewardPointsRange.max) {
    return null;
  }

  return points;
}
