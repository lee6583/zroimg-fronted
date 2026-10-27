// 画廊瀑布流布局（纯函数）：按已知宽高比把作品放进当前最短的一列，图片加载前后高度不变、不重排。
//
// 每张卡片在每个断点下的位置用三个数描述：列号 column、该列前面图片的「高宽比之和」ratioSum、
// 前面卡片数 count。卡片 top = ratioSum × 列宽 + count × (卡片底栏高 + 间距)。
// 这样服务端不需要知道屏幕宽度：五个断点的位置都写成 CSS 变量，由媒体查询选用；
// 客户端虚拟滚动时再用同一公式换算成像素。

type MasonryBreakpoint = {
  columns: number;
  // 视口宽度下限（含），与 gallery-feed.module.css 的媒体查询保持一致
  minViewport: number;
  // 用于“选最短列”的参考列宽：列宽变化时高度只按比例缩放，选择结果几乎不变
  referenceWidth: number;
  gap: number;
};

type MasonryItem = {
  key: string;
  // 宽 / 高；未知时按 1
  aspectRatio: number;
};

type MasonryPlacement = {
  column: number;
  ratioSum: number;
  count: number;
};

type MasonryColumn = {
  ratioSum: number;
  count: number;
};

type MasonryLayout = {
  // placements[i][b]：第 i 个作品在第 b 个断点下的位置
  placements: MasonryPlacement[][];
  // columns[b]：第 b 个断点下每一列的累计值，用来算容器高度
  columns: MasonryColumn[][];
};

/** 卡片底栏（标题 + 点赞/作者一行）的固定高度，CSS 中的 --gallery-footer 必须与它一致 */
export const cardFooterHeight = 58;

export const masonryBreakpoints: MasonryBreakpoint[] = [
  { columns: 1, minViewport: 0, referenceWidth: 320, gap: 12 },
  { columns: 2, minViewport: 360, referenceWidth: 180, gap: 12 },
  { columns: 3, minViewport: 900, referenceWidth: 280, gap: 16 },
  { columns: 4, minViewport: 1200, referenceWidth: 280, gap: 16 },
  { columns: 5, minViewport: 1440, referenceWidth: 265, gap: 16 },
];

// 极端宽高比限制在 1:3 到 3:1，避免一张超长图占满整列
const minRatio = 1 / 3;
const maxRatio = 3;

export function toAspectRatio(width: number | null | undefined, height: number | null | undefined) {
  if (!width || !height || width <= 0 || height <= 0) {
    return 1;
  }

  const ratio = width / height;
  return Math.min(maxRatio, Math.max(minRatio, ratio));
}

function emptyColumns(count: number) {
  const columns: MasonryColumn[] = [];
  for (let index = 0; index < count; index += 1) {
    columns.push({ ratioSum: 0, count: 0 });
  }
  return columns;
}

function shortestColumn(columns: MasonryColumn[], breakpoint: MasonryBreakpoint) {
  const rowHeight = cardFooterHeight + breakpoint.gap;
  let bestIndex = 0;
  let bestHeight = Number.POSITIVE_INFINITY;

  // 高度相同时取靠左的列，保证结果稳定
  columns.forEach((column, index) => {
    const height = column.ratioSum * breakpoint.referenceWidth + column.count * rowHeight;
    if (height < bestHeight - 0.5) {
      bestHeight = height;
      bestIndex = index;
    }
  });

  return bestIndex;
}

/** 计算所有断点下的瀑布流位置。追加分页时整体重算即可（O(作品数 × 5)）。 */
export function layoutMasonry(items: MasonryItem[]): MasonryLayout {
  const columns = masonryBreakpoints.map((breakpoint) => emptyColumns(breakpoint.columns));
  const placements: MasonryPlacement[][] = [];

  for (const item of items) {
    const itemPlacements: MasonryPlacement[] = [];

    masonryBreakpoints.forEach((breakpoint, breakpointIndex) => {
      const breakpointColumns = columns[breakpointIndex];
      const columnIndex = shortestColumn(breakpointColumns, breakpoint);
      const column = breakpointColumns[columnIndex];

      itemPlacements.push({ column: columnIndex, ratioSum: column.ratioSum, count: column.count });
      column.ratioSum += 1 / item.aspectRatio;
      column.count += 1;
    });

    placements.push(itemPlacements);
  }

  return { placements, columns };
}

/** 当前视口宽度对应的断点下标 */
export function breakpointIndexFor(viewportWidth: number) {
  let result = 0;
  masonryBreakpoints.forEach((breakpoint, index) => {
    if (viewportWidth >= breakpoint.minViewport) {
      result = index;
    }
  });
  return result;
}

export function columnWidthFor(containerWidth: number, breakpointIndex: number) {
  const breakpoint = masonryBreakpoints[breakpointIndex];
  const gaps = (breakpoint.columns - 1) * breakpoint.gap;
  return (containerWidth - gaps) / breakpoint.columns;
}

/** 某个位置在给定列宽下的像素 top */
export function placementTop(placement: MasonryPlacement, columnWidth: number, gap: number) {
  return placement.ratioSum * columnWidth + placement.count * (cardFooterHeight + gap);
}

/** 容器高度的 CSS 表达式：各列高度取最大值（列宽由 CSS 变量 --colw 给出） */
export function heightExpression(columns: MasonryColumn[]) {
  const parts = columns.map((column) => {
    const ratio = column.ratioSum.toFixed(4);
    return `calc(${ratio} * var(--colw) + ${column.count} * var(--row))`;
  });

  if (parts.length === 1) {
    return parts[0];
  }

  return `max(${parts.join(", ")})`;
}

export type { MasonryBreakpoint, MasonryColumn, MasonryItem, MasonryLayout, MasonryPlacement };
