export const CUSTOM_CREDITS_PER_CNY = 5;
export const CUSTOM_MIN_AMOUNT_CNY = 1;
export const CUSTOM_MAX_AMOUNT_CNY = 5000;

export function calculateCustomCredits(amountCny: number) {
  if (!Number.isFinite(amountCny)) return 0;
  return Math.floor(amountCny * CUSTOM_CREDITS_PER_CNY);
}
