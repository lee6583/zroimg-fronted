type ChangeDirection = "up" | "down" | "flat";

type KpiChangeInput = {
  today: number;
  yesterday: number;
  change: number;
  changePercent: number | null;
};

type KpiChange = {
  direction: ChangeDirection;
  // 主要展示：百分比、"新增" 或 "持平"
  label: string;
  // 绝对变化，带符号
  delta: string;
};

type ChartPoint = {
  x: number;
  y: number;
};

function formatNumber(value: number, fractionDigits = 0) {
  return value.toLocaleString("zh-CN", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function formatSigned(value: number, fractionDigits: number) {
  const text = formatNumber(Math.abs(value), fractionDigits);

  if (value > 0) {
    return `+${text}`;
  }

  if (value < 0) {
    return `-${text}`;
  }

  return text;
}

// 昨日为 0 时不计算百分比，避免出现无穷大。
function describeChange(kpi: KpiChangeInput, fractionDigits = 0): KpiChange {
  const delta = formatSigned(kpi.change, fractionDigits);

  if (kpi.change === 0) {
    return { direction: "flat", label: "持平", delta };
  }

  const direction: ChangeDirection = kpi.change > 0 ? "up" : "down";

  if (kpi.changePercent === null) {
    const label = kpi.yesterday === 0 ? "新增" : "—";
    return { direction, label, delta };
  }

  const percent = formatNumber(Math.abs(kpi.changePercent), 1);
  return { direction, label: `${percent}%`, delta };
}

function formatYuan(value: number) {
  return `¥${formatNumber(value, 2)}`;
}

// 刻度步长取 1、2、2.5、5 × 10^n 中能让刻度数不超过 maxTicks 的最小值；
// 计数类指标步长至少为 1 且必须是整数。
function niceAxis(maxValue: number, maxTicks: number, isInteger: boolean) {
  if (maxValue <= 0) {
    return { step: 1, max: 1, count: 1 };
  }

  const minStep = isInteger ? 1 : 0.01;
  const target = Math.max(maxValue / maxTicks, minStep);
  const exponent = Math.floor(Math.log10(target));
  const factors = [1, 2, 2.5, 5, 10];

  let step = 10 ** (exponent + 1);
  for (const factor of factors) {
    const candidate = Math.round(factor * 10 ** exponent * 100) / 100;
    const isInvalid = isInteger && !Number.isInteger(candidate);
    if (!isInvalid && candidate >= target - 1e-9) {
      step = candidate;
      break;
    }
  }

  const count = Math.max(1, Math.ceil(maxValue / step - 1e-9));
  const max = Math.round(step * count * 100) / 100;

  return { step, max, count };
}

// 单调三次插值（Fritsch–Carlson）：平滑且不会越过相邻点，数值为 0 的区段不会被画到 0 以下。
function buildSmoothPath(points: ChartPoint[]) {
  if (points.length === 0) {
    return "";
  }

  if (points.length === 1) {
    return `M${points[0].x},${points[0].y}`;
  }

  const count = points.length;
  const slopes: number[] = [];
  for (let index = 0; index < count - 1; index += 1) {
    const dx = points[index + 1].x - points[index].x;
    const dy = points[index + 1].y - points[index].y;
    slopes.push(dy / dx);
  }

  const tangents: number[] = [slopes[0]];
  for (let index = 1; index < count - 1; index += 1) {
    const before = slopes[index - 1];
    const after = slopes[index];
    const isTurningPoint = before * after <= 0;

    if (isTurningPoint) {
      tangents.push(0);
    } else {
      tangents.push((before + after) / 2);
    }
  }
  tangents.push(slopes[count - 2]);

  for (let index = 0; index < count - 1; index += 1) {
    const slope = slopes[index];
    if (slope === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }

    const alpha = tangents[index] / slope;
    const beta = tangents[index + 1] / slope;
    const length = alpha * alpha + beta * beta;
    if (length > 9) {
      const scale = 3 / Math.sqrt(length);
      tangents[index] = scale * alpha * slope;
      tangents[index + 1] = scale * beta * slope;
    }
  }

  const round = (value: number) => Math.round(value * 100) / 100;
  let path = `M${round(points[0].x)},${round(points[0].y)}`;
  for (let index = 0; index < count - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];
    const third = (end.x - start.x) / 3;
    const controlA = `${round(start.x + third)},${round(start.y + tangents[index] * third)}`;
    const controlB = `${round(end.x - third)},${round(end.y - tangents[index + 1] * third)}`;
    path += ` C${controlA} ${controlB} ${round(end.x)},${round(end.y)}`;
  }

  return path;
}

export { buildSmoothPath, describeChange, formatNumber, formatYuan, niceAxis };
export type { ChangeDirection, ChartPoint, KpiChange };
