"use client";

import clsx from "clsx";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useRef, useState } from "react";

type SliderVerificationProps = {
  verified: boolean;
  onStart?: () => Promise<number | false>;
  onVerified: (proof: SliderProof) => boolean | void | Promise<boolean | void>;
};

type SliderProof = {
  positionRatio: number;
  durationMs: number;
};

// 滑块按钮的默认边长（px）；实际尺寸随轨道高度变化（手机端更大，便于手指拖动），运行时从 DOM 读取。
const DEFAULT_KNOB_SIZE = 40;
const KNOB_INSET = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function SliderVerification(props: SliderVerificationProps) {
  const verified = props.verified;
  const onVerified = props.onVerified;
  const onStart = props.onStart;

  const t = useTranslations("auth.slider");
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  // 指针是否仍按着：拉取挑战是异步的，期间松手就不应再进入拖动状态。
  const isPointerDown = useRef(false);
  const dragStartX = useRef(0);
  const dragStartOffset = useRef(0);
  const [isDragging, setDragging] = useState(false);
  const [isVerifying, setVerifying] = useState(false);
  const [offset, setOffset] = useState(0);
  const [max, setMax] = useState(0);
  const [targetRatio, setTargetRatio] = useState(0.94);
  const dragStartedAt = useRef(0);

  const isComplete = verified || (isVerifying && offset > 0);
  let progress = 0;
  if (isComplete) {
    progress = 100;
  } else if (max > 0) {
    progress = (offset / max) * 100;
  }

  let statusText = t("hint");
  if (verified) {
    statusText = t("verified");
  } else if (isVerifying) {
    statusText = t("verifying");
  }

  let knobLeft: number | string = offset + KNOB_INSET;
  if (isComplete) {
    knobLeft = `calc(100% - ${KNOB_INSET}px)`;
  }

  function getMaxOffset() {
    const width = trackRef.current?.clientWidth ?? 0;
    const knobSize = knobRef.current?.offsetWidth || DEFAULT_KNOB_SIZE;
    return Math.max(width - knobSize - KNOB_INSET * 2, 0);
  }

  async function complete(nextMaxOffset: number, nextOffset: number) {
    setOffset(nextOffset);
    setDragging(false);
    setVerifying(true);

    const positionRatio = nextMaxOffset > 0 ? nextOffset / nextMaxOffset : targetRatio;
    const durationMs = Math.max(Date.now() - dragStartedAt.current, 250);
    try {
      const result = await onVerified({ positionRatio, durationMs });
      if (result === false) {
        setOffset(0);
      }
    } finally {
      setVerifying(false);
    }
  }

  async function start(clientX: number) {
    if (verified || isVerifying) return;

    setVerifying(true);
    const nextTargetRatio = onStart ? await onStart() : 0.94;
    if (nextTargetRatio === false || !isPointerDown.current) {
      setVerifying(false);
      return;
    }

    const nextMaxOffset = getMaxOffset();
    const safeTargetRatio = clamp(nextTargetRatio, 0.2, 0.94);
    setTargetRatio(safeTargetRatio);
    setMax(nextMaxOffset);
    dragStartX.current = clientX;
    dragStartOffset.current = offset;
    dragStartedAt.current = Date.now();
    setVerifying(false);
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
    if (nextMaxOffset > 0 && nextOffset >= nextMaxOffset * targetRatio) {
      complete(nextMaxOffset, nextMaxOffset * targetRatio);
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
      isPointerDown.current = false;
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
      complete(nextMaxOffset, nextMaxOffset * targetRatio);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      const nextOffset = clamp(offset + 24, 0, nextMaxOffset);
      if (nextMaxOffset > 0 && nextOffset >= nextMaxOffset * targetRatio) {
        complete(nextMaxOffset, nextMaxOffset * targetRatio);
        return;
      }
      setOffset(nextOffset);
    }
  }

  return (
    <div
      ref={trackRef}
      className={clsx(
        "relative h-13 w-full select-none overflow-hidden rounded-lg border transition-colors touch-none md:h-11",
        verified ? "border-emerald-500 bg-emerald-50" : "border-line bg-soft",
      )}
      role="slider"
      tabIndex={0}
      aria-label={t("label")}
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
        ref={knobRef}
        className={clsx(
          "absolute top-0.5 flex aspect-square h-[calc(100%-4px)] cursor-grab touch-none items-center justify-center rounded-md border shadow-sm active:cursor-grabbing",
          !isDragging && "transition-all duration-300",
          verified
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-line bg-background text-muted",
        )}
        style={{
          left: knobLeft,
          transform: isComplete ? "translateX(-100%)" : undefined,
        }}
        onPointerDown={(event) => {
          event.preventDefault();
          isPointerDown.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          void start(event.clientX);
        }}
        onPointerUp={() => {
          isPointerDown.current = false;
        }}
        onPointerCancel={() => {
          isPointerDown.current = false;
        }}
      >
        {verified ? (
          <Check size={18} aria-hidden />
        ) : (
          <svg
            className="h-5 w-5 md:h-4 md:w-4"
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
