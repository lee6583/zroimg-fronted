import assert from "node:assert/strict";
import test from "node:test";
import {
  getDeleteText,
  getDownloadName,
  getDurationText,
  getMediaLabel,
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
  assert.equal(getMediaLabel(image), "图片");
  assert.equal(getMediaLabel(video), "视频");
});

test("resolution shows quality for images and resolution for videos", () => {
  assert.equal(getResolutionText(image), "2K");
  assert.equal(getResolutionText({ ...image, quality: null }), "-");
  assert.equal(getResolutionText(video), "720p");
  assert.equal(getResolutionText({ ...video, resolution: null }), "-");
});

test("duration only shows for videos with a positive length", () => {
  assert.equal(getDurationText(video), "8s");
  assert.equal(getDurationText({ ...video, durationSeconds: 0 }), "");
  assert.equal(getDurationText({ ...video, durationSeconds: null }), "");
  assert.equal(getDurationText({ ...image, durationSeconds: 8 }), "");
});

test("download names use the media extension", () => {
  assert.equal(getDownloadName(image, 0), "zroimg-GT1-1.webp");
  assert.equal(getDownloadName({ ...image, format: null }, 1), "zroimg-GT1-2.png");
  assert.equal(getDownloadName(video, 0), "zroimg-GT2-1.mp4");
});

test("delete warning names the media type", () => {
  assert.equal(
    getDeleteText(video),
    "删除后视频将从存储中永久移除，且会同时从画廊和收藏中移除，无法恢复。",
  );
  assert.match(getDeleteText(image), /^删除后图片/);
});
