import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeOrderDisplayStatus } from "../src/utils/order-status.ts";

test("order display statuses collapse internal payment states", () => {
  assert.equal(normalizeOrderDisplayStatus("pending"), "pending");
  assert.equal(normalizeOrderDisplayStatus("paying"), "pending");
  assert.equal(normalizeOrderDisplayStatus("paid"), "paid");
  assert.equal(normalizeOrderDisplayStatus("fulfilled"), "paid");
  assert.equal(normalizeOrderDisplayStatus("closed"), "cancelled");
  assert.equal(normalizeOrderDisplayStatus("failed"), "cancelled");
});
