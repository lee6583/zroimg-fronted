export function calculateRechargeFeeCent(amountCent: number, feeRatePercent: number) {
  if (!Number.isFinite(amountCent) || !Number.isFinite(feeRatePercent)) return 0;
  if (amountCent <= 0 || feeRatePercent <= 0) return 0;

  const feeRateBasisPoints = Math.round(feeRatePercent * 100);
  return Math.ceil((amountCent * feeRateBasisPoints) / 10_000);
}

export function normalizeRechargeAmountBreakdown(input: {
  amountCent: number;
  rechargeAmountCent?: number | null;
  feeAmountCent?: number | null;
}) {
  return {
    rechargeAmountCent: input.rechargeAmountCent ?? input.amountCent,
    feeAmountCent: input.feeAmountCent ?? 0,
  };
}
