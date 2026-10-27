import assert from "node:assert/strict";
import test from "node:test";
import {
  fallbackRegisterConfig,
  normalizeRegisterConfig,
  parseRewardPointsInput,
} from "../src/utils/registration.ts";

test("register config keeps valid values", () => {
  assert.deepEqual(normalizeRegisterConfig({ registrationEnabled: false, rewardPoints: 10 }), {
    registrationEnabled: false,
    rewardPoints: 10,
  });
  assert.deepEqual(normalizeRegisterConfig({ registrationEnabled: true, rewardPoints: 0 }), {
    registrationEnabled: true,
    rewardPoints: 0,
  });
});

test("register config falls back to open registration without a reward", () => {
  assert.deepEqual(normalizeRegisterConfig(null), fallbackRegisterConfig);
  assert.deepEqual(normalizeRegisterConfig({ rewardPoints: -5 }), {
    registrationEnabled: true,
    rewardPoints: 0,
  });
  assert.deepEqual(normalizeRegisterConfig({ registrationEnabled: true, rewardPoints: 1.5 }), {
    registrationEnabled: true,
    rewardPoints: 0,
  });
});

test("reward points input accepts integers in range only", () => {
  assert.equal(parseRewardPointsInput("0"), 0);
  assert.equal(parseRewardPointsInput(" 10 "), 10);
  assert.equal(parseRewardPointsInput("1000000"), 1_000_000);
  assert.equal(parseRewardPointsInput("1000001"), null);
  assert.equal(parseRewardPointsInput("-1"), null);
  assert.equal(parseRewardPointsInput("1.5"), null);
  assert.equal(parseRewardPointsInput(""), null);
});
