import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateCustomCredits,
  CUSTOM_MAX_AMOUNT_CNY,
  CUSTOM_MIN_AMOUNT_CNY,
} from "../src/utils/credits.ts";
import { estimateGenerationCredits } from "../src/utils/generation-credits.ts";

test("custom purchases use the documented exchange rate", () => {
  assert.equal(calculateCustomCredits(CUSTOM_MIN_AMOUNT_CNY), 5);
  assert.equal(calculateCustomCredits(29.9), 149);
  assert.equal(calculateCustomCredits(CUSTOM_MAX_AMOUNT_CNY), 25_000);
});

test("generation estimates account for mode, quality, size, and count", () => {
  assert.equal(
    estimateGenerationCredits({
      mode: "text",
      quality: "low",
      size: "1024x1024",
      count: 1,
    }),
    10,
  );
  assert.equal(
    estimateGenerationCredits({
      mode: "edit",
      quality: "high",
      size: "2048x1152",
      count: 2,
    }),
    120,
  );
});

test("invalid dimensions fall back to the 1K price tier", () => {
  assert.equal(
    estimateGenerationCredits({
      mode: "text",
      quality: "medium",
      size: "invalid",
      count: 1,
    }),
    15,
  );
});
