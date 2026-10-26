type MaskTool = "brush" | "eraser";

// points 是按图片原始像素记录的 [x1, y1, x2, y2, ...]。
type MaskStroke = {
  tool: MaskTool;
  size: number;
  points: number[];
};

type MaskSize = {
  width: number;
  height: number;
};

type MaskContext = Pick<
  CanvasRenderingContext2D,
  | "globalCompositeOperation"
  | "fillStyle"
  | "strokeStyle"
  | "lineWidth"
  | "lineCap"
  | "lineJoin"
  | "clearRect"
  | "fillRect"
  | "beginPath"
  | "moveTo"
  | "lineTo"
  | "stroke"
>;

const minBrushSize = 8;
const maxBrushSize = 160;
const defaultBrushSize = 48;

function clampBrushSize(size: number) {
  if (!Number.isFinite(size)) return defaultBrushSize;
  const rounded = Math.round(size);
  return Math.min(maxBrushSize, Math.max(minBrushSize, rounded));
}

function fitSize(image: MaskSize, box: MaskSize) {
  const isEmpty = image.width <= 0 || image.height <= 0 || box.width <= 0 || box.height <= 0;
  if (isEmpty) {
    return { width: 0, height: 0, scale: 0 };
  }

  const scaleX = box.width / image.width;
  const scaleY = box.height / image.height;
  const scale = Math.min(1, scaleX, scaleY);

  return {
    width: Math.round(image.width * scale),
    height: Math.round(image.height * scale),
    scale,
  };
}

function toImagePoint(x: number, y: number, scale: number, image: MaskSize) {
  if (scale <= 0) return { x: 0, y: 0 };

  const imageX = Math.min(image.width, Math.max(0, x / scale));
  const imageY = Math.min(image.height, Math.max(0, y / scale));

  return { x: imageX, y: imageY };
}

// 单点按下时补一个相同终点，保证圆头画笔能画出一个点。
function startStroke(tool: MaskTool, size: number, x: number, y: number): MaskStroke {
  return { tool, size: clampBrushSize(size), points: [x, y, x, y] };
}

function extendStroke(stroke: MaskStroke, x: number, y: number): MaskStroke {
  const isSinglePoint =
    stroke.points.length === 4 &&
    stroke.points[0] === stroke.points[2] &&
    stroke.points[1] === stroke.points[3];
  const base = isSinglePoint ? stroke.points.slice(0, 2) : stroke.points;

  return { ...stroke, points: [...base, x, y] };
}

function hasPaint(strokes: MaskStroke[]) {
  return strokes.some((stroke) => stroke.tool === "brush");
}

// OpenAI 编辑遮罩约定：透明（alpha 0）为重绘区域，其余为不透明黑色。
function drawMask(context: MaskContext, strokes: MaskStroke[], size: MaskSize) {
  context.clearRect(0, 0, size.width, size.height);
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "#000000";
  context.fillRect(0, 0, size.width, size.height);

  for (const stroke of strokes) {
    if (stroke.points.length < 2) continue;

    if (stroke.tool === "brush") {
      context.globalCompositeOperation = "destination-out";
    } else {
      context.globalCompositeOperation = "source-over";
    }
    context.strokeStyle = "#000000";
    context.lineWidth = stroke.size;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(stroke.points[0], stroke.points[1]);
    for (let index = 2; index < stroke.points.length; index += 2) {
      context.lineTo(stroke.points[index], stroke.points[index + 1]);
    }
    if (stroke.points.length === 2) {
      context.lineTo(stroke.points[0], stroke.points[1]);
    }
    context.stroke();
  }

  context.globalCompositeOperation = "source-over";
}

export {
  clampBrushSize,
  defaultBrushSize,
  drawMask,
  extendStroke,
  fitSize,
  hasPaint,
  maxBrushSize,
  minBrushSize,
  startStroke,
  toImagePoint,
};

export type { MaskContext, MaskSize, MaskStroke, MaskTool };
