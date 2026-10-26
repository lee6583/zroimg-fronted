import assert from "node:assert/strict";
import test from "node:test";
import {
  getRetryAttempt,
  getRetryLabel,
  getRetryWait,
  getTaskStatusLabel,
  getTaskStatusMessage,
  isTaskRetrying,
} from "../src/utils/task-status.ts";
import type { TaskTranslator } from "../src/utils/task-status.ts";

const now = new Date(2026, 9, 26, 12, 0, 0).getTime();

test("未重试或缺少重试字段时沿用原状态文案", () => {
  assert.equal(getTaskStatusLabel({ status: "pending" }), "排队中");
  assert.equal(getTaskStatusLabel({ status: "processing" }), "生成中");
  assert.equal(getTaskStatusLabel({ status: "succeeded" }), "已完成");
  assert.equal(getTaskStatusLabel({ status: "failed" }), "失败");
  assert.equal(
    getTaskStatusLabel({ status: "processing", attemptCount: 1, retrying: false }),
    "生成中",
  );
});

test("等待下一次尝试时 N 为已尝试次数加一", () => {
  const task = { status: "pending", attemptCount: 1, maxAttempts: 4, retrying: true };
  assert.equal(isTaskRetrying(task), true);
  assert.equal(getRetryAttempt(task), 2);
  assert.equal(getTaskStatusLabel(task), "重试中（第 2 次）");
});

test("重试执行中时 N 为当前尝试次数", () => {
  const task = { status: "processing", attemptCount: 2, maxAttempts: 4, retrying: true };
  assert.equal(getRetryAttempt(task), 2);
  assert.equal(getTaskStatusLabel(task), "重试中（第 2 次）");
});

test("终态任务即使带 retrying 也不显示重试", () => {
  const task = { status: "failed", attemptCount: 4, retrying: true };
  assert.equal(isTaskRetrying(task), false);
  assert.equal(getTaskStatusLabel(task), "失败");
});

test("下一次尝试在未来时附加倒计时", () => {
  const task = {
    status: "pending",
    attemptCount: 1,
    retrying: true,
    nextAttemptTime: "2026-10-26T12:00:11.400",
  };
  assert.equal(getRetryWait(task, now), 12);
  assert.equal(getTaskStatusLabel(task, now), "重试中（第 2 次） · 12s 后");
  assert.equal(getTaskStatusLabel(task), "重试中（第 2 次）");
});

test("倒计时到期、执行中或时间缺失时不显示倒计时", () => {
  const base = { attemptCount: 2, retrying: true };
  const past = { ...base, status: "pending", nextAttemptTime: "2026-10-26T11:59:59" };
  const running = { ...base, status: "processing", nextAttemptTime: "2026-10-26T12:00:30" };
  const empty = { ...base, status: "pending", nextAttemptTime: null };
  assert.equal(getTaskStatusLabel(past, now), "重试中（第 3 次）");
  assert.equal(getTaskStatusLabel(running, now), "重试中（第 2 次）");
  assert.equal(getTaskStatusLabel(empty, now), "重试中（第 3 次）");
});

const fakeT = ((key: string, values?: Record<string, number>) => {
  return values ? `${key}:${JSON.stringify(values)}` : key;
}) as unknown as TaskTranslator;

test("传入 t 时返回 task 命名空间的 key 与参数", () => {
  assert.equal(getTaskStatusLabel({ status: "pending" }, fakeT), "status.pending");
  assert.equal(getTaskStatusLabel({ status: "unknown" }, fakeT), "unknown");
  const waiting = {
    status: "pending",
    attemptCount: 1,
    retrying: true,
    nextAttemptTime: "2026-10-26T12:00:11.400",
  };
  assert.equal(getTaskStatusLabel(waiting, fakeT, now), 'retryingWait:{"attempt":2,"seconds":12}');
  assert.equal(getTaskStatusLabel(waiting, fakeT), 'retrying:{"attempt":2}');
  assert.equal(getRetryLabel(waiting, fakeT, now), 'retryingWait:{"attempt":2,"seconds":12}');
});

test("描述对象可供自定义渲染", () => {
  assert.deepEqual(getTaskStatusMessage({ status: "failed" }), { key: "status.failed" });
  assert.deepEqual(
    getTaskStatusMessage({ status: "processing", attemptCount: 2, retrying: true }),
    {
      key: "retrying",
      values: { attempt: 2 },
    },
  );
});
