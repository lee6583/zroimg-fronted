import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSmoothPath, describeChange, niceAxis } from "../src/utils/dashboard.ts";

test("change vs yesterday never shows infinity", () => {
  const fromZero = describeChange({ today: 23, yesterday: 0, change: 23, changePercent: null });
  assert.deepEqual(fromZero, { direction: "up", label: "新增", delta: "+23" });

  const bothZero = describeChange({ today: 0, yesterday: 0, change: 0, changePercent: null });
  assert.deepEqual(bothZero, { direction: "flat", label: "持平", delta: "0" });
});

test("change vs yesterday formats percent and signed delta", () => {
  const down = describeChange({ today: 1, yesterday: 3, change: -2, changePercent: -66.7 });
  assert.deepEqual(down, { direction: "down", label: "66.7%", delta: "-2" });

  const revenue = describeChange(
    { today: 15.99, yesterday: 10, change: 5.99, changePercent: 59.9 },
    2,
  );
  assert.deepEqual(revenue, { direction: "up", label: "59.9%", delta: "+5.99" });
});

test("axis ticks snap to readable numbers", () => {
  assert.deepEqual(niceAxis(0, 5, true), { step: 1, max: 1, count: 1 });
  assert.deepEqual(niceAxis(0, 5, false), { step: 1, max: 1, count: 1 });
  assert.deepEqual(niceAxis(23, 5, true), { step: 5, max: 25, count: 5 });
  assert.deepEqual(niceAxis(7, 5, true), { step: 2, max: 8, count: 4 });
  assert.deepEqual(niceAxis(15.99, 5, false), { step: 5, max: 20, count: 4 });
  assert.deepEqual(niceAxis(0.7, 5, false), { step: 0.2, max: 0.8, count: 4 });
  assert.deepEqual(niceAxis(1234, 5, true), { step: 250, max: 1250, count: 5 });
});

test("smooth path stays flat on flat data and passes through every point", () => {
  const flat = buildSmoothPath([
    { x: 0, y: 100 },
    { x: 10, y: 100 },
    { x: 20, y: 100 },
  ]);
  assert.equal(flat, "M0,100 C3.33,100 6.67,100 10,100 C13.33,100 16.67,100 20,100");

  const spike = buildSmoothPath([
    { x: 0, y: 100 },
    { x: 10, y: 0 },
    { x: 20, y: 100 },
  ]);
  const values = spike.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const ys = values.filter((_, index) => index % 2 === 1);
  assert.ok(ys.every((y) => y >= 0 && y <= 100));
  assert.ok(spike.includes(" 10,0 "));
});
