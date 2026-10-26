import assert from "node:assert/strict";
import test from "node:test";
import { mergeMessages } from "../src/i18n/merge-messages.ts";

const base = {
  common: { save: "保存", cancel: "取消" },
  nav: { home: "首页", nested: { deep: "深层" } },
};

test("uses translated values and falls back to zh-CN for missing or empty ones", () => {
  const missing: string[] = [];
  const merged = mergeMessages(base, { common: { save: "Save", cancel: "" }, nav: {} }, missing);

  assert.deepEqual(merged, {
    common: { save: "Save", cancel: "取消" },
    nav: { home: "首页", nested: { deep: "深层" } },
  });
  assert.deepEqual(missing, ["common.cancel", "nav.home", "nav.nested.deep"]);
});

test("ignores extra keys and mismatched shapes", () => {
  const missing: string[] = [];
  const merged = mergeMessages(base, { common: "oops", extra: { a: "b" } }, missing);

  assert.deepEqual(merged, base);
  assert.equal(missing.length, 4);
});
