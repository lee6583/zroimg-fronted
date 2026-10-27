import assert from "node:assert/strict";
import test from "node:test";
import {
  chunkIds,
  isSupportedImageType,
  maxImageBytes,
  maxImageFiles,
  publicAssetThumbnailUrl,
  toThumbnailUrl,
  userAssetPreviewUrl,
  userAssetThumbnailUrl,
} from "../src/utils/media.ts";

test("media limits stay explicit", () => {
  assert.equal(maxImageFiles, 4);
  assert.equal(maxImageBytes, 20 * 1024 * 1024);
});

test("only supported image MIME types are accepted", () => {
  assert.equal(isSupportedImageType("image/png"), true);
  assert.equal(isSupportedImageType("image/jpeg"), true);
  assert.equal(isSupportedImageType("image/webp"), true);
  assert.equal(isSupportedImageType("image/svg+xml"), false);
  assert.equal(isSupportedImageType("application/octet-stream"), false);
});

test("asset URL helpers point at the right tier", () => {
  assert.equal(userAssetThumbnailUrl("12"), "/api/media/user/assets/12/thumbnail");
  assert.equal(userAssetPreviewUrl("12"), "/api/media/user/assets/12/preview");
  assert.equal(publicAssetThumbnailUrl("5"), "/api/media/public/assets/5/thumbnail");
});

test("content URLs are rewritten to thumbnails, other URLs are kept", () => {
  assert.equal(
    toThumbnailUrl("/api/media/user/assets/34/content"),
    "/api/media/user/assets/34/thumbnail",
  );
  assert.equal(
    toThumbnailUrl("/api/gallery/admin/submissions/3/content"),
    "/api/gallery/admin/submissions/3/content",
  );
  assert.equal(toThumbnailUrl("https://cdn.example.com/a.png"), "https://cdn.example.com/a.png");
});

test("preview ids are deduplicated and chunked by the API limit", () => {
  const ids = Array.from({ length: 205 }, (_, index) => String(index));
  const chunks = chunkIds([...ids, "1", ""]);
  assert.deepEqual(
    chunks.map((chunk) => chunk.length),
    [100, 100, 5],
  );
  assert.deepEqual(chunkIds([]), []);
});
