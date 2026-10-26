import assert from "node:assert/strict";
import test from "node:test";
import {
  clampBrushSize,
  drawMask,
  extendStroke,
  fitSize,
  hasPaint,
  startStroke,
  toImagePoint,
} from "../src/features/canvas/mask-model.ts";
import type { MaskContext, MaskStroke } from "../src/features/canvas/mask-model.ts";

type Call = [string, ...unknown[]];

function createContext() {
  const calls: Call[] = [];
  const context = {
    globalCompositeOperation: "source-over",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    lineCap: "butt",
    lineJoin: "miter",
    clearRect: (...args: number[]) => calls.push(["clearRect", ...args]),
    fillRect: (...args: number[]) => calls.push(["fillRect", ...args]),
    beginPath: () => calls.push(["beginPath"]),
    moveTo: (...args: number[]) => calls.push(["moveTo", ...args]),
    lineTo: (...args: number[]) => calls.push(["lineTo", ...args]),
    stroke: () => calls.push(["stroke", context.globalCompositeOperation, context.lineWidth]),
  };

  return { calls, context: context as unknown as MaskContext };
}

test("图片按比例缩小进容器且不放大", () => {
  assert.deepEqual(fitSize({ width: 2000, height: 1000 }, { width: 800, height: 800 }), {
    width: 800,
    height: 400,
    scale: 0.4,
  });
  assert.deepEqual(fitSize({ width: 1000, height: 2000 }, { width: 800, height: 500 }), {
    width: 250,
    height: 500,
    scale: 0.25,
  });
  assert.deepEqual(fitSize({ width: 300, height: 200 }, { width: 800, height: 800 }), {
    width: 300,
    height: 200,
    scale: 1,
  });
  assert.equal(fitSize({ width: 0, height: 200 }, { width: 800, height: 800 }).scale, 0);
});

test("显示坐标换算为原图像素并限制在图片内", () => {
  const image = { width: 2000, height: 1000 };
  assert.deepEqual(toImagePoint(400, 200, 0.4, image), { x: 1000, y: 500 });
  assert.deepEqual(toImagePoint(-10, 900, 0.4, image), { x: 0, y: 1000 });
});

test("画笔尺寸限制在 8 到 160 像素", () => {
  assert.equal(clampBrushSize(2), 8);
  assert.equal(clampBrushSize(500), 160);
  assert.equal(clampBrushSize(47.6), 48);
  assert.equal(clampBrushSize(Number.NaN), 48);
});

test("单点笔画在移动后不保留重复起点", () => {
  const stroke = startStroke("brush", 40, 10, 20);
  assert.deepEqual(stroke.points, [10, 20, 10, 20]);
  const next = extendStroke(stroke, 30, 40);
  assert.deepEqual(next.points, [10, 20, 30, 40]);
  assert.deepEqual(extendStroke(next, 50, 60).points, [10, 20, 30, 40, 50, 60]);
});

test("只有画笔笔画才算涂抹区域", () => {
  assert.equal(hasPaint([]), false);
  assert.equal(hasPaint([startStroke("eraser", 20, 1, 1)]), false);
  assert.equal(hasPaint([startStroke("brush", 20, 1, 1)]), true);
});

test("遮罩先填充不透明黑色，画笔挖空、橡皮擦恢复", () => {
  const { calls, context } = createContext();
  const strokes: MaskStroke[] = [
    { tool: "brush", size: 40, points: [10, 10, 100, 100] },
    { tool: "eraser", size: 20, points: [50, 50, 60, 60] },
  ];

  drawMask(context, strokes, { width: 1024, height: 768 });

  assert.deepEqual(calls[0], ["clearRect", 0, 0, 1024, 768]);
  assert.deepEqual(calls[1], ["fillRect", 0, 0, 1024, 768]);
  const strokeCalls = calls.filter((call) => call[0] === "stroke");
  assert.deepEqual(strokeCalls, [
    ["stroke", "destination-out", 40],
    ["stroke", "source-over", 20],
  ]);
  assert.deepEqual(
    calls.filter((call) => call[0] === "moveTo"),
    [
      ["moveTo", 10, 10],
      ["moveTo", 50, 50],
    ],
  );
  assert.equal(context.globalCompositeOperation, "source-over");
});
