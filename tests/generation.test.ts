import assert from "node:assert/strict";
import test from "node:test";
import { resolveActiveConversationId } from "../src/features/generation/generation-model.ts";
import { getImageResolutionLabel } from "../src/utils/generation-quality.ts";

const conversations = [{ id: "first" }, { id: "remembered" }];

test("优先恢复仍然存在的会话", () => {
  assert.equal(resolveActiveConversationId(conversations, "remembered"), "remembered");
});

test("跳过已删除的会话并使用下一个有效选择", () => {
  assert.equal(resolveActiveConversationId(conversations, "deleted", "remembered"), "remembered");
});

test("没有有效偏好时使用第一条会话", () => {
  assert.equal(resolveActiveConversationId(conversations, "deleted"), "first");
  assert.equal(resolveActiveConversationId([], "deleted"), "");
});

test("图片 quality 使用分辨率档位显示", () => {
  assert.equal(getImageResolutionLabel("low"), "1K");
  assert.equal(getImageResolutionLabel("medium"), "2K");
  assert.equal(getImageResolutionLabel("high"), "4K");
  assert.equal(getImageResolutionLabel("auto"), "自动");
});
