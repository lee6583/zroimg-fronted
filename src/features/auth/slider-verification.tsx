"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

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
  const [isDragging, setDragging] = useState(false);
  const [isVerifying, setVerifying] = useState(false);
  const [offset, setOffset] = useState(0);
  const [max, setMax] = useState(0);

  const isComplete = verified || isVerifying;
  let progress = 0;
  if (isComplete) {
    progress = 100;
  } else if (max > 0) {
    progress = (offset / max) * 100;
  }

  let statusText = "向右滑动完成验证";
  if (verified) {
    statusText = "验证通过";
  } else if (isVerifying) {
    statusText = "验证中...";
  }

  let knobLeft: number | string = offset + 2;
  if (isComplete) {
    knobLeft = `calc(100% - ${KNOB_SIZE + 2}px)`;
  }

  function getMaxOffset() {
    const width = trackRef.current?.clientWidth ?? 0;
    return Math.max(width - KNOB_SIZE - 4, 0);
  }

  async function complete(nextMaxOffset: number) {
    setOffset(nextMaxOffset);
    setDragging(false);
    setVerifying(true);
    try {
      const result = await onVerified();
      if (result === false) {
        setOffset(0);
      }
    } finally {
      setVerifying(false);
    }
  }

  function start(clientX: number) {
    if (verified || isVerifying) return;
    const nextMaxOffset = getMaxOffset();
    setMax(nextMaxOffset);
    dragStartX.current = clientX;
    dragStartOffset.current = offset;
    setDragging(true);
  }

  function move(clientX: number) {
    if (!isDragging || verified || isVerifying) return;
    const nextMaxOffset = max || getMaxOffset();
    const nextOffset = clamp(
      dragStartOffset.current + clientX - dragStartX.current,
      0,
      nextMaxOffset,
    );
    if (nextMaxOffset > 0 && nextOffset >= nextMaxOffset * 0.94) {
      complete(nextMaxOffset);
      return;
    }
    setOffset(nextOffset);
  }

  function stop() {
    if (verified || isVerifying) return;
    setDragging(false);
    setOffset(0);
  }

  const handleWindowPointerMove = useEffectEvent((clientX: number) => {
    move(clientX);
  });

  const handleWindowPointerUp = useEffectEvent(() => {
    stop();
  });

  useEffect(() => {
    if (!isDragging) return;

    function handlePointerMove(event: PointerEvent) {
      handleWindowPointerMove(event.clientX);
    }

    function handlePointerUp() {
      handleWindowPointerUp();
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isDragging]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (verified || isVerifying) return;
    const nextMaxOffset = getMaxOffset();
    setMax(nextMaxOffset);

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
      className={clsx(
        "relative h-11 w-full select-none overflow-hidden rounded-lg border transition-colors touch-none",
        verified ? "border-emerald-500 bg-emerald-50" : "border-line bg-soft",
      )}
      role="slider"
      tabIndex={0}
      aria-label="安全滑块验证"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progress)}
      onKeyDown={handleKeyDown}
    >
      <div
        className={clsx(
          "absolute inset-y-0 left-0",
          !isDragging && "transition-all duration-300",
          verified ? "bg-emerald-500/20" : "bg-foreground/5",
        )}
        style={{ width: `${progress}%` }}
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className={clsx("text-xs font-medium", verified ? "text-emerald-600" : "text-muted")}>
          {statusText}
        </span>
      </div>
      <div
        className={clsx(
          "absolute top-0.5 flex aspect-square h-[calc(100%-4px)] cursor-grab items-center justify-center rounded-md border shadow-sm active:cursor-grabbing",
          !isDragging && "transition-all duration-300",
          verified
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-line bg-background text-muted",
        )}
        style={{ left: knobLeft }}
        onPointerDown={(event) => {
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          start(event.clientX);
        }}
      >
        {verified ? (
          <Check size={16} />
        ) : (
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M9 18l6-6-6-6" />
            <path d="M15 18l6-6-6-6" opacity="0.5" />
          </svg>
        )}
      </div>
    </div>
  );
}
