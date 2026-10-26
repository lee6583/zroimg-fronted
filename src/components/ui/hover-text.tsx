"use client";

import clsx from "clsx";
import { useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import styles from "./hover-text.module.css";

type HoverTextProps = {
  text: string;
  // 截断样式由调用方的 className 提供（单行省略或 line-clamp），这里只负责悬浮展开。
  className?: string;
  // 渲染的标签；默认 span。
  as?: "span" | "h2" | "p";
};

type Popover = { style: CSSProperties };

const gap = 6;
const margin = 12;
const maxWidth = 480;

/** 文本被截断时，鼠标悬浮显示完整内容，移开后恢复；没有被截断就什么都不做。 */
export function HoverText(props: HoverTextProps) {
  const ref = useRef<HTMLElement>(null);
  const Tag = props.as ?? "span";
  const [popover, setPopover] = useState<Popover | null>(null);

  function show() {
    const element = ref.current;
    if (!element) return;
    const isClipped =
      element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
    if (!isClipped) return;

    const rect = element.getBoundingClientRect();
    const width = Math.min(maxWidth, window.innerWidth - margin * 2);
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - width - margin);
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < 160 && rect.top > spaceBelow;
    setPopover({
      style: {
        left,
        width,
        ...(placeAbove
          ? { bottom: window.innerHeight - rect.top + gap, maxHeight: rect.top - margin - gap }
          : { top: rect.bottom + gap, maxHeight: spaceBelow - margin - gap }),
      },
    });
  }

  return (
    <>
      <Tag
        ref={ref as never}
        className={clsx(styles.hoverText, props.className)}
        onMouseEnter={show}
        onMouseLeave={() => setPopover(null)}
      >
        {props.text}
      </Tag>
      {popover
        ? createPortal(
            <div role="tooltip" className={styles.hoverText__popover} style={popover.style}>
              {props.text}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
