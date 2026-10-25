export function calculateCustomCredits(amountCny: number, creditsPerYuan: number) {
  if (!Number.isFinite(amountCny)) return 0;
  return Math.floor(amountCny * creditsPerYuan);
}
