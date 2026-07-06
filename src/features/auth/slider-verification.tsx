"use client";

import { Check } from "lucide-react";
import { useRef, useState } from "react";

type SliderVerificationProps = {
  verified: boolean;
  onVerified: () => boolean | void | Promise<boolean | void>;
};

const KNOB_SIZE = 40;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function SliderVerification({ verified, onVerified }: SliderVerificationProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [offset, setOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);

  const progress = verified || verifying ? 100 : maxOffset > 0 ? (offset / maxOffset) * 100 : 0;

  function getMaxOffset() {
    const width = trackRef.current?.clientWidth ?? 0;
    return Math.max(width - KNOB_SIZE - 4, 0);
  }

  async function complete(nextMaxOffset: number) {
    setOffset(nextMaxOffset);
    setDragging(false);
    setVerifying(true);
    const result = await onVerified();
    setVerifying(false);

    if (result === false) {
      setOffset(0);
    }
  }

  function start(clientX: number) {
    if (verified || verifying) return;
    const nextMaxOffset = getMaxOffset();
    setMaxOffset(nextMaxOffset);
    dragStartX.current = clientX;
    dragStartOffset.current = offset;
    setDragging(true);
  }

  function move(clientX: number) {
    if (!dragging || verified || verifying) return;
    const nextMaxOffset = maxOffset || getMaxOffset();
    const nextOffset = clamp(dragStartOffset.current + clientX - dragStartX.current, 0, nextMaxOffset);
    if (nextMaxOffset > 0 && nextOffset >= nextMaxOffset * 0.94) {
      complete(nextMaxOffset);
      return;
    }
    setOffset(nextOffset);
  }

  function stop() {
    if (verified || verifying) return;
    setDragging(false);
    setOffset(0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (verified || verifying) return;
    const nextMaxOffset = getMaxOffset();
    setMaxOffset(nextMaxOffset);

    if (event.key === "End" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      complete(nextMaxOffset);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextOffset = clamp(offset + 24, 0, nextMaxOffset);
      if (nextMaxOffset > 0 && nextOffset >= nextMaxOffset * 0.94) {
        complete(nextMaxOffset);
        return;
      }
      setOffset(nextOffset);
    }
  }

  return (
    <div
      ref={trackRef}
      className={`relative h-11 w-full select-none overflow-hidden rounded-lg border transition-colors ${
        verified ? "border-emerald-500 bg-emerald-50" : "border-line bg-soft"
      }`}
      role="slider"
      tabIndex={0}
      aria-label="安全滑块验证"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      onKeyDown={handleKeyDown}
      onMouseMove={(event) => move(event.clientX)}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchMove={(event) => move(event.touches[0]?.clientX ?? 0)}
      onTouchEnd={stop}
    >
      <div
        className={`absolute inset-y-0 left-0 ${dragging ? "" : "transition-all duration-300"} ${
          verified ? "bg-emerald-500/20" : "bg-foreground/5"
        }`}
        style={{ width: `${progress}%` }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className={`text-xs font-medium ${verified ? "text-emerald-600" : "text-muted"}`}>
          {verified ? "验证通过" : verifying ? "验证中..." : "向右滑动完成验证"}
        </span>
      </div>
      <div
        className={`absolute top-0.5 flex aspect-square h-[calc(100%-4px)] cursor-grab items-center justify-center rounded-md border shadow-sm active:cursor-grabbing ${
          dragging ? "" : "transition-all duration-300"
        } ${verified ? "border-emerald-500 bg-emerald-500 text-white" : "border-line bg-background text-muted"}`}
        style={{ left: verified || verifying ? `calc(100% - ${KNOB_SIZE + 2}px)` : offset + 2 }}
        onMouseDown={(event) => start(event.clientX)}
        onTouchStart={(event) => start(event.touches[0]?.clientX ?? 0)}
      >
        {verified ? (
          <Check size={16} />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
            <path d="M15 18l6-6-6-6" opacity="0.5" />
          </svg>
        )}
      </div>
    </div>
  );
}
