import {
  createMockUser,
  findUserByEmail,
  findUserBundleByUserId,
  getStore,
  nextId,
} from "@/server/bff/mock-store";

export { createMockUser, findUserByEmail, findUserBundleByUserId };

export function createSliderToken(email: string) {
  const token = `mock-slider-${nextId("slider")}`;

  getStore().sliderTokens.push({
    token,
    email,
    expiresAt: Date.now() + 5 * 60 * 1000,
    used: false,
  });

  return token;
}

export function consumeSliderToken(email: string, token: string) {
  const sliderToken = getStore().sliderTokens.find(
    (item) => item.token === token && item.email === email,
  );

  if (!sliderToken || sliderToken.used || sliderToken.expiresAt < Date.now()) {
    throw new Error("安全验证已失效，请重新完成滑块验证");
  }

  sliderToken.used = true;
  return sliderToken;
}

export function saveVerificationCode(email: string, code: string) {
  const store = getStore();

  store.verificationCodes = store.verificationCodes.filter((item) => item.email !== email);
  store.verificationCodes.push({
    id: nextId("verification"),
    email,
    code,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return code;
}

export function consumeVerificationCode(email: string, code: string) {
  const store = getStore();
  const verification = store.verificationCodes.find((item) => item.email === email);

  if (!verification || verification.expiresAt < Date.now()) {
    throw new Error("验证码已过期，请重新获取");
  }

  if (verification.code !== code) {
    throw new Error("验证码错误");
  }

  store.verificationCodes = store.verificationCodes.filter(
    (item) => item.id !== verification.id,
  );

  return verification;
}

