import assert from "node:assert/strict";
import test from "node:test";
import {
  getDownloadName,
  getDurationSeconds,
  getMediaKind,
  getResolutionText,
  isVideoTask,
} from "../src/utils/history.ts";

const image = {
  taskNo: "GT1",
  modelType: "image",
  quality: "medium",
  resolution: null,
  durationSeconds: null,
  format: "webp",
};

const video = {
  taskNo: "GT2",
  modelType: "video",
  quality: null,
  resolution: "720p",
  durationSeconds: 8,
  format: null,
};

test("history rows tell images and videos apart", () => {
  assert.equal(isVideoTask(image), false);
  assert.equal(isVideoTask(video), true);
  assert.equal(getMediaKind(image), "image");
  assert.equal(getMediaKind(video), "video");
});

test("resolution shows quality tier for images and resolution for videos", () => {
  assert.equal(getResolutionText(image), "2K");
  assert.equal(getResolutionText({ ...image, quality: "high" }), "4K");
  assert.equal(getResolutionText({ ...image, quality: "auto" }), "auto");
  assert.equal(getResolutionText({ ...image, quality: null }), "");
  assert.equal(getResolutionText(video), "720p");
  assert.equal(getResolutionText({ ...video, resolution: null }), "");
});

test("duration only shows for videos with a positive length", () => {
  assert.equal(getDurationSeconds(video), 8);
  assert.equal(getDurationSeconds({ ...video, durationSeconds: 0 }), null);
  assert.equal(getDurationSeconds({ ...video, durationSeconds: null }), null);
  assert.equal(getDurationSeconds({ ...image, durationSeconds: 8 }), null);
});

test("download names use the media extension", () => {
  assert.equal(getDownloadName(image, 0), "zroimg-GT1-1.webp");
  assert.equal(getDownloadName({ ...image, format: null }, 1), "zroimg-GT1-2.png");
  assert.equal(getDownloadName(video, 0), "zroimg-GT2-1.mp4");
});
