"use client";

import clsx from "clsx";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import type { AdminDashboardMetric, AdminDashboardTrendPoint } from "@/types/admin";
import { buildSmoothPath, formatNumber, formatYuan, niceAxis } from "@/utils/dashboard";
import styles from "./dashboard-trend.module.css";

type DashboardTrendProps = {
  points: AdminDashboardTrendPoint[];
  days: number;
};

const metrics: { key: AdminDashboardMetric; label: string }[] = [
  { key: "revenue", label: "收入" },
  { key: "orders", label: "订单" },
  { key: "tasks", label: "生成任务" },
  { key: "users", label: "新增用户" },
];

const ranges = [7, 30];
const minChartHeight = 240;
const padding = { top: 16, right: 16, bottom: 28, left: 48 };
const maxTicks = 5;

function formatValue(metric: AdminDashboardMetric, value: number) {
  if (metric === "revenue") {
    return formatYuan(value);
  }

  return formatNumber(value);
}

function formatTick(metric: AdminDashboardMetric, value: number) {
  const hasFraction = !Number.isInteger(value);
  const text = formatNumber(value, hasFraction ? 1 : 0);

  if (metric === "revenue") {
    return `¥${text}`;
  }

  return text;
}

function shortDate(date: string) {
  return `${date.slice(5, 7)}/${date.slice(8, 10)}`;
}

function longDate(date: string) {
  return `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
}

export function DashboardTrend(props: DashboardTrendProps) {
  const points = props.points;
  const days = props.days;

  const [metric, setMetric] = useState<AdminDashboardMetric>("revenue");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const frameRef = useRef<HTMLDivElement>(null);
  const gradientId = useId();

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      const nextSize = {
        width: Math.floor(rect.width),
        height: Math.max(minChartHeight, Math.floor(rect.height)),
      };
      setSize(nextSize);
    });
    observer.observe(frame);

    return () => {
      observer.disconnect();
    };
  }, []);

  // 第一步：取出当前指标的序列和汇总。
  const metricLabel = metrics.find((item) => item.key === metric)?.label ?? "";
  const values = points.map((point) => point[metric]);
  const total = values.reduce((sum, value) => sum + value, 0);
  const maxValue = Math.max(0, ...values);
  const peakIndex = values.indexOf(maxValue);
  const axis = niceAxis(maxValue, maxTicks, metric !== "revenue");
  const axisMax = axis.max;

  // 第二步：把数据映射到绘图区坐标。
  const width = size.width;
  const chartHeight = size.height;
  const plotWidth = Math.max(0, width - padding.left - padding.right);
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const baseline = padding.top + plotHeight;
  const stepX = points.length > 1 ? plotWidth / (points.length - 1) : 0;
  const coordinates = values.map((value, index) => {
    const x = padding.left + index * stepX;
    const y = baseline - (value / axisMax) * plotHeight;
    return { x, y };
  });

  const linePath = buildSmoothPath(coordinates);
  const lastPoint = coordinates[coordinates.length - 1];
  const firstPoint = coordinates[0];
  const areaPath =
    linePath && lastPoint && firstPoint
      ? `${linePath} L${lastPoint.x},${baseline} L${firstPoint.x},${baseline} Z`
      : "";

  const ticks = Array.from({ length: axis.count + 1 }, (_, index) => {
    const value = Math.round(axis.step * index * 100) / 100;
    const y = baseline - (value / axisMax) * plotHeight;
    return { value, y };
  });

  // 日期标签按可用宽度抽稀（至少约 48px 一个），从今天往前数，保证今天一定有标签。
  const labelSteps = [1, 2, 5, 7, 10];
  const labelStep = labelSteps.find((item) => stepX * item >= 48) ?? 10;
  const lastIndex = points.length - 1;

  const activePoint = activeIndex === null ? null : points[activeIndex];
  const activeCoordinate = activeIndex === null ? null : coordinates[activeIndex];
  const tooltipLeft = activeCoordinate
    ? Math.min(Math.max(activeCoordinate.x, 64), Math.max(64, width - 64))
    : 0;
  // 点太靠上时提示框放到点下方，避免压住顶部控件。
  const isTooltipBelow = activeCoordinate ? activeCoordinate.y < 64 : false;
  let tooltipTop = 0;
  if (activeCoordinate) {
    tooltipTop = isTooltipBelow ? activeCoordinate.y + 12 : activeCoordinate.y - 12;
  }

  const totalText = formatValue(metric, total);
  const peakText =
    maxValue > 0
      ? `，最高 ${longDate(points[peakIndex].date)} ${formatValue(metric, maxValue)}`
      : "";
  const summary = `${metricLabel}近 ${days} 天合计 ${totalText}${peakText}`;

  function updateFromPointer(event: PointerEvent<SVGRectElement>) {
    if (points.length === 0 || stepX === 0) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const offset = event.clientX - bounds.left - padding.left;
    const index = Math.round(offset / stepX);
    const clamped = Math.min(Math.max(index, 0), lastIndex);
    setActiveIndex(clamped);
  }

  function moveActive(event: KeyboardEvent<HTMLDivElement>) {
    const current = activeIndex ?? lastIndex;
    let next = current;

    if (event.key === "ArrowLeft") {
      next = Math.max(0, current - 1);
    } else if (event.key === "ArrowRight") {
      next = Math.min(lastIndex, current + 1);
    } else if (event.key === "Home") {
      next = 0;
    } else if (event.key === "End") {
      next = lastIndex;
    } else if (event.key === "Escape") {
      setActiveIndex(null);
      return;
    } else {
      return;
    }

    event.preventDefault();
    setActiveIndex(next);
  }

  return (
    <section className={styles.trend} aria-label="趋势">
      <header className={styles.trend__header}>
        <div className={styles.trend__tabs} role="tablist" aria-label="趋势指标">
          {metrics.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={metric === item.key}
              className={clsx(styles.trend__tab, metric === item.key && styles.trend__tabActive)}
              onClick={() => {
                setMetric(item.key);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={styles.trend__tools}>
          <span className={styles.trend__total}>
            合计 <strong>{totalText}</strong>
          </span>
          <nav className={styles.trend__ranges} aria-label="统计范围">
            {ranges.map((range) => (
              <Link
                key={range}
                href={range === 7 ? "/admin" : `/admin?days=${range}`}
                scroll={false}
                aria-current={days === range ? "true" : undefined}
                className={clsx(styles.trend__range, days === range && styles.trend__rangeActive)}
              >
                {range}天
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <div
        ref={frameRef}
        className={styles.trend__frame}
        tabIndex={0}
        role="group"
        aria-label={`${summary}。使用左右方向键逐日查看。`}
        onKeyDown={moveActive}
        onFocus={() => {
          if (activeIndex === null) {
            setActiveIndex(lastIndex);
          }
        }}
        onBlur={() => {
          setActiveIndex(null);
        }}
      >
        {width > 0 ? (
          <svg
            className={styles.trend__svg}
            width={width}
            height={chartHeight}
            viewBox={`0 0 ${width} ${chartHeight}`}
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" className={styles.trend__gradientTop} />
                <stop offset="100%" className={styles.trend__gradientBottom} />
              </linearGradient>
            </defs>

            {ticks.map((tick) => (
              <g key={tick.value}>
                <line
                  className={tick.value === 0 ? styles.trend__baseline : styles.trend__grid}
                  x1={padding.left}
                  x2={width - padding.right}
                  y1={tick.y}
                  y2={tick.y}
                />
                <text
                  className={styles.trend__axisText}
                  x={padding.left - 8}
                  y={tick.y}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {formatTick(metric, tick.value)}
                </text>
              </g>
            ))}

            {points.map((point, index) => {
              const isLabeled = (lastIndex - index) % labelStep === 0;
              if (!isLabeled) {
                return null;
              }

              const isFirst = index === 0;
              const isLast = index === lastIndex;
              let anchor: "start" | "middle" | "end" = "middle";
              if (isFirst && labelStep === 1) {
                anchor = "start";
              }
              if (isLast) {
                anchor = "end";
              }

              return (
                <text
                  key={point.date}
                  className={styles.trend__axisText}
                  x={coordinates[index].x}
                  y={chartHeight - 8}
                  textAnchor={anchor}
                >
                  {isLast ? "今天" : shortDate(point.date)}
                </text>
              );
            })}

            <path className={styles.trend__area} d={areaPath} fill={`url(#${gradientId})`} />
            <path className={styles.trend__line} d={linePath} />

            {activeCoordinate ? (
              <g>
                <line
                  className={styles.trend__crosshair}
                  x1={activeCoordinate.x}
                  x2={activeCoordinate.x}
                  y1={padding.top}
                  y2={baseline}
                />
                <circle
                  className={styles.trend__dot}
                  cx={activeCoordinate.x}
                  cy={activeCoordinate.y}
                  r={4}
                />
              </g>
            ) : lastPoint ? (
              <circle className={styles.trend__dot} cx={lastPoint.x} cy={lastPoint.y} r={3} />
            ) : null}

            <rect
              className={styles.trend__hit}
              x={0}
              y={0}
              width={width}
              height={chartHeight}
              onPointerMove={updateFromPointer}
              onPointerDown={updateFromPointer}
              onPointerLeave={() => {
                setActiveIndex(null);
              }}
            />
          </svg>
        ) : null}

        {activePoint && activeCoordinate ? (
          <div
            className={clsx(styles.trend__tooltip, isTooltipBelow && styles.trend__tooltipBelow)}
            style={{ left: tooltipLeft, top: tooltipTop }}
            aria-live="polite"
          >
            <span className={styles.trend__tooltipDate}>{longDate(activePoint.date)}</span>
            <span className={styles.trend__tooltipValue}>
              {metricLabel} {formatValue(metric, activePoint[metric])}
            </span>
          </div>
        ) : null}
      </div>

      <table className={styles.trend__srTable}>
        <caption>{summary}</caption>
        <thead>
          <tr>
            <th scope="col">日期</th>
            <th scope="col">{metricLabel}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.date}>
              <td>{point.date}</td>
              <td>{formatValue(metric, point[metric])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
