import assert from "node:assert/strict";
import test from "node:test";
import {
  findDefaultOptions,
  getDefaultOptions,
  isTaskPending,
  normalizeOptions,
  resolveActiveConversationId,
} from "../src/features/generation/generation-model.ts";
import type { GenerationModel } from "../src/types/generation.ts";
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
  assert.equal(
    getImageResolutionLabel("auto", (key) => key),
    "quality.auto",
  );
  assert.equal(
    getImageResolutionLabel("high", (key) => key),
    "4K",
  );
  assert.equal(
    getImageResolutionLabel("ultra", (key) => key),
    "ultra",
  );
});

const model: GenerationModel = {
  modelCode: "gpt-image-2",
  modelName: "GPT Image 2",
  provider: "openai",
  modelType: "image",
  supportModes: ["text_to_image", "image_to_image"],
  supportParams: {
    ratios: ["1:1", "16:9"],
    qualities: ["low", "medium"],
    counts: [1, 2, 4],
    defaults: { mode: "text_to_image", ratio: "1:1", quality: "low", count: 1 },
  },
  priceVersion: "v1",
  defaultFlag: 1,
  sortOrder: 10,
  remark: null,
};

test("默认选项来自 Java 模型 supportParams.defaults", () => {
  assert.deepEqual(getDefaultOptions([model]), {
    mode: "text_to_image",
    modelCode: "gpt-image-2",
    ratio: "1:1",
    quality: "low",
    count: 1,
  });
});

test("不支持的参数回退到模型默认值", () => {
  const options = {
    mode: "image_to_image" as const,
    modelCode: "x",
    ratio: "9:16",
    quality: "medium",
    count: 3,
  };
  assert.deepEqual(normalizeOptions(options, [model]), {
    mode: "image_to_image",
    modelCode: "gpt-image-2",
    ratio: "1:1",
    quality: "medium",
    count: 1,
  });
});

test("pending 和 processing 视为进行中", () => {
  assert.equal(isTaskPending({ status: "pending" }), true);
  assert.equal(isTaskPending({ status: "processing" }), true);
  assert.equal(isTaskPending({ status: "failed" }), false);
});

test("no usable image model yields no default options instead of throwing", () => {
  assert.equal(findDefaultOptions([]), null);
  const inpaintOnly = { ...model, supportModes: ["inpaint" as const] };
  assert.equal(findDefaultOptions([inpaintOnly]), null);
  assert.throws(() => getDefaultOptions([]), /No usable image model/);
});

test("AI 润色参考图去空、去重并最多保留 4 张", async () => {
  const { normalizePolishReferences } = await import("../src/features/polish/polish-references.ts");
  assert.deepEqual(normalizePolishReferences(undefined), []);
  assert.deepEqual(normalizePolishReferences([null, undefined, " "]), []);
  assert.deepEqual(normalizePolishReferences(["1", "1", " 2 ", null, "3", "4", "5"]), [
    "1",
    "2",
    "3",
    "4",
  ]);
});
