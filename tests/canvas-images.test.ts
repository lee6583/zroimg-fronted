import assert from "node:assert/strict";
import test from "node:test";
import {
  getFrameRatio,
  nearestImageIds,
  previewPixels,
  previewZoom,
  shouldUsePreview,
  withRetry,
} from "../src/features/canvas/image-loading.ts";

test("frame ratio prefers original size, then thumbnail size, then square", () => {
  assert.equal(getFrameRatio(2048, 1024), 2);
  assert.equal(getFrameRatio(null, null, 768, 1024), 0.75);
  assert.equal(getFrameRatio(null, null), 1);
  assert.equal(getFrameRatio(0, 0, null, null), 1);
});

test("frame ratio is clamped so extreme images keep a usable frame", () => {
  assert.equal(getFrameRatio(10000, 10), 5);
  assert.equal(getFrameRatio(10, 10000), 0.2);
});

test("preview tier is used when zoomed in past the threshold", () => {
  const base = { cssWidth: 280, pixelRatio: 1, isActive: false };
  assert.equal(shouldUsePreview({ ...base, zoom: 1 }), false);
  assert.equal(shouldUsePreview({ ...base, zoom: previewZoom }), true);
  assert.equal(shouldUsePreview({ ...base, zoom: 2 }), true);
});

test("active nodes switch to preview only when device pixels exceed the limit", () => {
  const base = { cssWidth: 280, zoom: 1, isActive: true };
  // 280 × 1 × 2 = 560，缩略图足够
  assert.equal(shouldUsePreview({ ...base, pixelRatio: 2 }), false);
  // 280 × 1 × 3 = 840 > 700
  assert.equal(shouldUsePreview({ ...base, pixelRatio: 3 }), true);
  assert.equal(shouldUsePreview({ ...base, pixelRatio: 3, isActive: false }), false);
  assert.ok(280 * 3 > previewPixels);
});

test("nearest images are ordered by distance from the viewport center", () => {
  const images = [
    { id: "far", position: { x: 1000, y: 1000 }, width: 100, height: 100 },
    { id: "near", position: { x: -50, y: -50 }, width: 100, height: 100 },
    { id: "mid", position: { x: 200, y: 0 }, width: 100, height: 100 },
  ];

  assert.deepEqual(nearestImageIds(images, { x: 0, y: 0 }, 2), ["near", "mid"]);
  assert.deepEqual(nearestImageIds(images, { x: 0, y: 0 }), ["near", "mid", "far"]);
  assert.deepEqual(nearestImageIds([], { x: 0, y: 0 }), []);
});

test("retry adds a counter without breaking existing query strings", () => {
  assert.equal(withRetry("/a/thumbnail", 0), "/a/thumbnail");
  assert.equal(withRetry("/a/thumbnail", 2), "/a/thumbnail?r=2");
  assert.equal(withRetry("/a/thumbnail?x=1", 1), "/a/thumbnail?x=1&r=1");
});
