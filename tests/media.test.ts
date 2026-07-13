import assert from "node:assert/strict";
import test from "node:test";
import { isSupportedImageType, maxImageBytes, maxImageFiles } from "../src/utils/media.ts";

test("media limits stay explicit", () => {
  assert.equal(maxImageFiles, 4);
  assert.equal(maxImageBytes, 10 * 1024 * 1024);
});

test("only supported image MIME types are accepted", () => {
  assert.equal(isSupportedImageType("image/png"), true);
  assert.equal(isSupportedImageType("image/jpeg"), true);
  assert.equal(isSupportedImageType("image/webp"), true);
  assert.equal(isSupportedImageType("image/svg+xml"), false);
  assert.equal(isSupportedImageType("application/octet-stream"), false);
});
