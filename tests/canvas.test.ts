import assert from "node:assert/strict";
import test from "node:test";
import type { Edge } from "@xyflow/react";
import {
  buildTaskRequest,
  createEdge,
  createGeneratorNode,
  createImageNode,
  createNoteNode,
  flowFromScene,
  getMode,
  getPendingTasks,
  getUpstreamImage,
  imageNodeWidth,
  isValidConnection,
  pickCover,
  placeResults,
  resolveOptions,
  resultGap,
  sceneFromFlow,
  type CanvasNode,
} from "../src/features/canvas/canvas-model.ts";
import type { GenerationModel } from "../src/types/generation.ts";

const options = { modelCode: "m1", ratio: "1:1", quality: "low", count: 1 };

function makeModel(code: string, modes: string[]): GenerationModel {
  return {
    modelCode: code,
    modelName: code,
    provider: "test",
    modelType: "image",
    supportModes: modes,
    supportParams: {
      ratios: ["1:1", "16:9"],
      qualities: ["low", "high"],
      counts: [1, 2, 4],
      defaults: { mode: null, ratio: "16:9", quality: "high", count: 2 },
    },
    priceVersion: "v1",
    defaultFlag: 0,
    sortOrder: 0,
    remark: null,
  };
}

function setup() {
  const image = createImageNode({ x: 0, y: 0 }, { mediaAssetId: "a1", width: 1024, height: 768 });
  const other = createImageNode({ x: 0, y: 400 }, { mediaAssetId: "a2" });
  const generator = createGeneratorNode({ x: 400, y: 0 }, options);
  const note = createNoteNode({ x: 0, y: 800 });
  const nodes: CanvasNode[] = [image, other, generator, note];
  return { image, other, generator, note, nodes };
}

test("只允许图片连到生成节点，且生成节点只接收一张参考图", () => {
  const { image, other, generator, note, nodes } = setup();
  const empty: Edge[] = [];

  assert.equal(isValidConnection({ source: image.id, target: generator.id }, nodes, empty), true);
  assert.equal(isValidConnection({ source: generator.id, target: image.id }, nodes, empty), false);
  assert.equal(isValidConnection({ source: note.id, target: generator.id }, nodes, empty), false);
  assert.equal(isValidConnection({ source: image.id, target: other.id }, nodes, empty), false);
  assert.equal(isValidConnection({ source: image.id, target: image.id }, nodes, empty), false);

  const edges = [createEdge(image.id, generator.id)];
  assert.equal(isValidConnection({ source: other.id, target: generator.id }, nodes, edges), false);
});

test("读取生成节点上游图片，忽略生成结果连线", () => {
  const { image, generator, nodes } = setup();
  assert.equal(getUpstreamImage(generator.id, nodes, []), null);

  const result = createImageNode({ x: 800, y: 0 }, { mediaAssetId: "r1" });
  const edges = [createEdge(generator.id, result.id), createEdge(image.id, generator.id)];
  const upstream = getUpstreamImage(generator.id, [...nodes, result], edges);
  assert.equal(upstream?.id, image.id);
});

test("按蒙版和上游图片推导生成模式", () => {
  const { image, generator } = setup();
  const uploading = createImageNode({ x: 0, y: 0 }, { isUploading: true });

  assert.equal(getMode(generator.data, null), "text_to_image");
  assert.equal(getMode(generator.data, uploading), "text_to_image");
  assert.equal(getMode(generator.data, image), "image_to_image");
  assert.equal(getMode({ ...generator.data, maskMediaId: "m" }, image), "inpaint");
});

test("构造画布生成请求", () => {
  const { image, generator } = setup();
  const data = { ...generator.data, prompt: "  cat  " };

  const textRequest = buildTaskRequest("c1", data, null);
  assert.deepEqual(textRequest, {
    canvasId: "c1",
    modelCode: "m1",
    prompt: "cat",
    mode: "text_to_image",
    ratio: "1:1",
    quality: "low",
    count: 1,
  });

  const editRequest = buildTaskRequest("c1", data, image);
  assert.equal(editRequest.mode, "image_to_image");
  assert.equal(editRequest.referenceMediaId, "a1");
  assert.equal(editRequest.maskMediaId, undefined);

  const inpaintData = { ...data, referenceMediaId: "a9", maskMediaId: "mask" };
  const inpaintRequest = buildTaskRequest("c1", inpaintData, image);
  assert.equal(inpaintRequest.mode, "inpaint");
  assert.equal(inpaintRequest.referenceMediaId, "a9");
  assert.equal(inpaintRequest.maskMediaId, "mask");
});

test("按模式过滤模型并校正参数", () => {
  const models = [makeModel("t", ["text_to_image"]), makeModel("e", ["image_to_image"])];

  assert.deepEqual(resolveOptions({ ...options, modelCode: "t" }, models, "text_to_image"), {
    modelCode: "t",
    ratio: "1:1",
    quality: "low",
    count: 1,
  });
  assert.deepEqual(
    resolveOptions({ ...options, modelCode: "t", count: 3 }, models, "image_to_image"),
    {
      modelCode: "e",
      ratio: "1:1",
      quality: "low",
      count: 2,
    },
  );
  assert.equal(resolveOptions(options, models, "inpaint"), null);
});

test("结果图在生成节点右侧按两列网格排布", () => {
  const { generator } = setup();
  const results = [1, 2, 3].map((index) => ({
    mediaAssetId: `r${index}`,
    resultId: `id${index}`,
    url: null,
    width: null,
    height: null,
  }));

  const placed = placeResults(generator, results, "16:9");
  const startX = generator.position.x + 320 + resultGap * 3;
  const height = Math.round((imageNodeWidth * 9) / 16);

  assert.equal(placed.length, 3);
  assert.deepEqual(placed[0].position, { x: startX, y: 0 });
  assert.deepEqual(placed[1].position, { x: startX + imageNodeWidth + resultGap, y: 0 });
  assert.deepEqual(placed[2].position, { x: startX, y: height + resultGap });
  assert.equal(placed[1].data.resultId, "id2");

  const square = placeResults(generator, results, null);
  assert.equal(square[2].position.y, imageNodeWidth + resultGap);

  const sized = placeResults(generator, [{ ...results[0], width: 100, height: 200 }], null);
  assert.equal(sized[0].data.height, 200);
});

test("封面取第一张已上传图片", () => {
  const { generator, note } = setup();
  const uploading = createImageNode({ x: 0, y: 0 }, { isUploading: true });
  const image = createImageNode({ x: 0, y: 0 }, { mediaAssetId: "cover" });

  assert.equal(pickCover([generator, uploading, note, image]), "cover");
  assert.equal(pickCover([generator, note]), null);
});

test("场景保存剔除运行时字段并可还原", () => {
  const { image, generator, note } = setup();
  const uploading = createImageNode({ x: 9, y: 9 }, { isUploading: true });
  const nodes: CanvasNode[] = [
    { ...image, selected: true, dragging: true, measured: { width: 280, height: 210 } },
    generator,
    note,
    uploading,
  ];
  const edges: Edge[] = [
    { ...createEdge(image.id, generator.id), selected: true, animated: true },
    createEdge(generator.id, uploading.id),
  ];

  const scene = sceneFromFlow(nodes, edges, { x: 10, y: 20, zoom: 0.5 });
  assert.equal(scene.nodes.length, 3);
  assert.equal(scene.edges.length, 1);
  assert.deepEqual(Object.keys(scene.nodes[0]).sort(), ["data", "id", "position", "type"]);
  assert.equal("isUploading" in scene.nodes[0].data, false);
  assert.deepEqual(Object.keys(scene.edges[0]).sort(), ["id", "source", "target"]);
  assert.deepEqual(scene.viewport, { x: 10, y: 20, zoom: 0.5 });

  const json = JSON.parse(JSON.stringify(scene));
  const flow = flowFromScene(json);
  assert.deepEqual(sceneFromFlow(flow.nodes, flow.edges, flow.viewport), scene);

  const empty = flowFromScene(null);
  assert.deepEqual(empty.nodes, []);
  assert.deepEqual(empty.viewport, { x: 0, y: 0, zoom: 1 });
});

test("只轮询未落图的进行中任务", () => {
  const base = { x: 0, y: 0 };
  const waiting = createGeneratorNode(base, options, { taskNo: "t1", status: "processing" });
  const done = createGeneratorNode(base, options, {
    taskNo: "t2",
    status: "succeeded",
    resultsApplied: true,
  });
  const fresh = createGeneratorNode(base, options);

  assert.deepEqual(getPendingTasks([waiting, done, fresh]), [{ nodeId: waiting.id, taskNo: "t1" }]);
});
