import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateRechargeFeeCent,
  normalizeRechargeAmountBreakdown,
} from "../src/utils/recharge.ts";

test("recharge fee rounds up to whole cents", () => {
  assert.equal(calculateRechargeFeeCent(1, 1), 1);
  assert.equal(calculateRechargeFeeCent(100, 2.5), 3);
  assert.equal(calculateRechargeFeeCent(10_000, 1.25), 125);
});

test("recharge fee is zero when disabled or amount is invalid", () => {
  assert.equal(calculateRechargeFeeCent(10_000, 0), 0);
  assert.equal(calculateRechargeFeeCent(0, 2), 0);
  assert.equal(calculateRechargeFeeCent(Number.NaN, 2), 0);
});

test("legacy orders fall back to the original amount breakdown", () => {
  assert.deepEqual(normalizeRechargeAmountBreakdown({ amountCent: 2990 }), {
    rechargeAmountCent: 2990,
    feeAmountCent: 0,
  });
  assert.deepEqual(
    normalizeRechargeAmountBreakdown({
      amountCent: 3065,
      rechargeAmountCent: 2990,
      feeAmountCent: 75,
    }),
    {
      rechargeAmountCent: 2990,
      feeAmountCent: 75,
    },
  );
});
