import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatElapsed,
  formatVideoTime,
  getVideoStage,
  isVideoRunning,
  parseJavaTime,
  parseRatio,
  shortFailReason,
} from "../src/utils/video-task.ts";

test("Java video statuses map to UI stages", () => {
  assert.equal(getVideoStage(null), "idle");
  assert.equal(getVideoStage("pending"), "queued");
  assert.equal(getVideoStage("processing"), "generating");
  assert.equal(getVideoStage("succeeded"), "completed");
  assert.equal(getVideoStage("failed"), "failed");
  assert.equal(getVideoStage("toString"), "idle");
  assert.equal(getVideoStage("pending", true), "retrying");
  assert.equal(getVideoStage("processing", true), "retrying");
  assert.equal(getVideoStage("failed", true), "failed");
  assert.equal(isVideoRunning("retrying"), true);
  assert.equal(isVideoRunning("queued"), true);
  assert.equal(isVideoRunning("generating"), true);
  assert.equal(isVideoRunning("completed"), false);
  assert.equal(isVideoRunning("failed"), false);
});

test("Java local date times parse as browser local time", () => {
  const local = new Date(2026, 9, 26, 17, 36, 55).getTime();
  assert.equal(parseJavaTime("2026-10-26T17:36:55"), local);
  assert.equal(parseJavaTime("2026-10-26 17:36:55"), local);
  assert.equal(parseJavaTime("2026-10-26T17:36:55.123456"), local + 123);
  assert.equal(parseJavaTime("2026-10-26T09:36:55Z"), Date.UTC(2026, 9, 26, 9, 36, 55));
  assert.equal(parseJavaTime(""), null);
  assert.equal(parseJavaTime("not a date"), null);
});

test("elapsed time stays compact", () => {
  assert.equal(formatElapsed(-500), "0s");
  assert.equal(formatElapsed(18_400), "18s");
  assert.equal(formatElapsed(65_000), "1m 05s");
  assert.equal(formatElapsed(3_725_000), "1h 02m");
});

test("ratios parse into positive pairs", () => {
  assert.deepEqual(parseRatio("16:9"), { width: 16, height: 9 });
  assert.deepEqual(parseRatio("9:16"), { width: 9, height: 16 });
  assert.deepEqual(parseRatio("3 / 2"), { width: 3, height: 2 });
  assert.equal(parseRatio("0:1"), null);
  assert.equal(parseRatio("auto"), null);
  assert.equal(parseRatio(null), null);
});

test("fail reasons collapse to one readable line", () => {
  assert.equal(
    shortFailReason("视频下载地址不安全：上游返回了非 HTTPS 地址"),
    "视频下载地址不安全：上游返回了非 HTTPS 地址",
  );
  assert.equal(shortFailReason("  超时\n  stack trace"), "超时");
  assert.equal(shortFailReason('{"error":"bad"}'), "生成未完成，请稍后重试");
  assert.equal(shortFailReason(null), "生成未完成，请稍后重试");
});

test("video times drop seconds", () => {
  assert.equal(formatVideoTime("2026-10-26T17:36:55"), "2026-10-26 17:36");
  assert.equal(formatVideoTime(null), "-");
});
