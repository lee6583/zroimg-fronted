import assert from "node:assert/strict";
import test from "node:test";
import { calculateCustomCredits } from "../src/utils/credits.ts";

test("custom purchases use the configured exchange rate", () => {
  assert.equal(calculateCustomCredits(1, 5), 5);
  assert.equal(calculateCustomCredits(29.9, 5), 149);
  assert.equal(calculateCustomCredits(5000, 5), 25_000);
  assert.equal(calculateCustomCredits(Number.NaN, 5), 0);
});
