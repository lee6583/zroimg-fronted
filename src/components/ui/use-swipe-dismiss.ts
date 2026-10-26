"use client";

import { useRef, useState, type CSSProperties, type TouchEvent } from "react";

const dismissDistance = 96;

/**
 * 触摸下滑关闭：返回绑定到容器上的触摸事件和跟随手指的位移样式。
 * 只处理单指、以纵向为主的下滑；多指（缩放）和横向滑动不拦截。
 */
export function useSwipeDismiss(onDismiss: () => void) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState(0);

  function onTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) {
      startRef.current = null;
      return;
    }

    const touch = event.touches[0];
    startRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchMove(event: TouchEvent) {
    const start = startRef.current;
    if (!start || event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];
    const deltaY = touch.clientY - start.y;
    const deltaX = Math.abs(touch.clientX - start.x);
    if (deltaY <= 0 || deltaX > deltaY) {
      setOffset(0);
      return;
    }

    setOffset(deltaY);
  }

  function onTouchEnd() {
    const shouldDismiss = offset > dismissDistance;
    startRef.current = null;
    setOffset(0);

    if (shouldDismiss) {
      onDismiss();
    }
  }

  let style: CSSProperties | undefined;
  if (offset > 0) {
    style = {
      transform: `translateY(${offset}px)`,
      opacity: Math.max(0.4, 1 - offset / 400),
      transition: "none",
    };
  }

  return {
    handlers: { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd },
    style,
  };
}
