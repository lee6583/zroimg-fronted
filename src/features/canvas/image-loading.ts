// 画布图片加载策略（纯函数）：画布只加载缩略图/预览图，原图只给查看大图、下载、遮罩和局部重绘

type Point = {
  x: number;
  y: number;
};

type PositionedImage = {
  id: string;
  position: Point;
  width: number;
  height: number;
};

type PreviewDecision = {
  zoom: number;
  cssWidth: number;
  pixelRatio: number;
  isActive: boolean;
};

// 缩放到这个倍数以上，缩略图（768）开始不够清晰，换成预览图（1600）
export const previewZoom = 1.3;
// 选中/悬停时，屏幕实际像素宽度超过这个值也换预览图
export const previewPixels = 700;
// 打开画布时优先加载离视口中心最近的几张
export const priorityCount = 6;

const fallbackRatio = 1;
const minRatio = 0.2;
const maxRatio = 5;

// 图片框的宽高比：优先原图尺寸，其次缩略图尺寸，都没有时用正方形占位
export function getFrameRatio(
  width: number | null | undefined,
  height: number | null | undefined,
  thumbWidth?: number | null,
  thumbHeight?: number | null,
) {
  let ratio = fallbackRatio;
  if (width && height) {
    ratio = width / height;
  } else if (thumbWidth && thumbHeight) {
    ratio = thumbWidth / thumbHeight;
  }

  return Math.min(maxRatio, Math.max(minRatio, ratio));
}

export function shouldUsePreview(decision: PreviewDecision) {
  if (decision.zoom >= previewZoom) {
    return true;
  }
  if (!decision.isActive) {
    return false;
  }

  const devicePixels = decision.cssWidth * decision.zoom * decision.pixelRatio;
  return devicePixels > previewPixels;
}

// 按节点中心到视口中心（画布坐标）的距离排序，返回最近的若干个节点 id
export function nearestImageIds(images: PositionedImage[], center: Point, count = priorityCount) {
  const ranked = images.map((image) => {
    const dx = image.position.x + image.width / 2 - center.x;
    const dy = image.position.y + image.height / 2 - center.y;
    return { id: image.id, distance: Math.hypot(dx, dy) };
  });
  ranked.sort((imageA, imageB) => imageA.distance - imageB.distance);

  return ranked.slice(0, count).map((image) => image.id);
}

// 加载失败重试时给地址加计数参数，绕过浏览器对失败请求的复用
export function withRetry(url: string, attempt: number) {
  if (attempt <= 0) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}r=${attempt}`;
}

export type { PositionedImage, PreviewDecision };
