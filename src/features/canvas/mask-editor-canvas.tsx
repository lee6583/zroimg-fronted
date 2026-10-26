"use client";

import type Konva from "konva";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Circle, Image as KonvaImage, Layer, Line, Stage } from "react-konva";
import { fitSize, toImagePoint } from "./mask-model";
import type { MaskSize, MaskStroke, MaskTool } from "./mask-model";
import styles from "./mask-editor-dialog.module.css";

type MaskEditorCanvasProps = {
  imageUrl: string;
  width: number | null;
  height: number | null;
  strokes: MaskStroke[];
  tool: MaskTool;
  size: number;
  onStart: (x: number, y: number) => void;
  onMove: (x: number, y: number) => void;
  onLoad: (size: MaskSize) => void;
  onError: () => void;
};

type LoadedImage = {
  url: string;
  element: HTMLImageElement;
  size: MaskSize;
};

type CursorPoint = {
  x: number;
  y: number;
};

const fallbackPaint = "rgba(239, 68, 68, 1)";

function readPaintColor() {
  const value = getComputedStyle(document.documentElement).getPropertyValue("--mask-paint");
  return value.trim() || fallbackPaint;
}

function readSize(element: HTMLImageElement, width: number | null, height: number | null) {
  const hasPropSize = Boolean(width && height && width > 0 && height > 0);
  if (hasPropSize) {
    return { width: Number(width), height: Number(height) };
  }

  return { width: element.naturalWidth, height: element.naturalHeight };
}

export function MaskEditorCanvas(props: MaskEditorCanvasProps) {
  const imageUrl = props.imageUrl;
  const width = props.width;
  const height = props.height;
  const strokes = props.strokes;
  const tool = props.tool;
  const size = props.size;
  const onStart = props.onStart;
  const onMove = props.onMove;
  const onLoad = props.onLoad;
  const onError = props.onError;
  const t = useTranslations("canvas.mask");

  const boxRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const callbacksRef = useRef({ onLoad, onError });
  const [box, setBox] = useState<MaskSize>({ width: 0, height: 0 });
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [cursor, setCursor] = useState<CursorPoint | null>(null);
  const [paint] = useState(readPaintColor);

  useEffect(() => {
    callbacksRef.current = { onLoad, onError };
  }, [onLoad, onError]);

  useEffect(() => {
    const element = boxRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0].contentRect;
      setBox({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
    });
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isActive = true;
    const element = new window.Image();

    element.onload = () => {
      if (!isActive) return;
      const imageSize = readSize(element, width, height);
      setImage({ url: imageUrl, element, size: imageSize });
      callbacksRef.current.onLoad(imageSize);
    };
    element.onerror = () => {
      if (!isActive) return;
      callbacksRef.current.onError();
    };
    element.src = imageUrl;

    return () => {
      isActive = false;
      element.onload = null;
      element.onerror = null;
    };
  }, [imageUrl, width, height]);

  const loaded = image?.url === imageUrl ? image : null;
  const imageSize = loaded?.size ?? { width: 0, height: 0 };
  const fit = fitSize(imageSize, box);

  function readPoint(event: Konva.KonvaEventObject<PointerEvent>) {
    const stage = event.target.getStage();
    const pointer = stage?.getPointerPosition();
    if (!pointer) return null;

    return toImagePoint(pointer.x, pointer.y, fit.scale, imageSize);
  }

  function startDraw(event: Konva.KonvaEventObject<PointerEvent>) {
    const point = readPoint(event);
    if (!point) return;

    event.evt.preventDefault();
    isDrawingRef.current = true;
    setCursor(point);
    onStart(point.x, point.y);
  }

  function moveDraw(event: Konva.KonvaEventObject<PointerEvent>) {
    const point = readPoint(event);
    if (!point) return;

    setCursor(point);
    if (!isDrawingRef.current) return;
    event.evt.preventDefault();
    onMove(point.x, point.y);
  }

  function endDraw() {
    isDrawingRef.current = false;
  }

  function leaveStage() {
    isDrawingRef.current = false;
    setCursor(null);
  }

  const canRender = Boolean(loaded) && fit.scale > 0;

  return (
    <div ref={boxRef} className={styles.maskEditor__stageBox}>
      {canRender && loaded ? (
        <Stage
          className={styles.maskEditor__stage}
          width={fit.width}
          height={fit.height}
          scaleX={fit.scale}
          scaleY={fit.scale}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerCancel={endDraw}
          onPointerLeave={leaveStage}
        >
          <Layer listening={false}>
            <KonvaImage image={loaded.element} width={imageSize.width} height={imageSize.height} />
          </Layer>
          <Layer listening={false} opacity={0.5}>
            {strokes.map((stroke, index) => (
              <Line
                key={index}
                points={stroke.points}
                stroke={paint}
                strokeWidth={stroke.size}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  stroke.tool === "eraser" ? "destination-out" : "source-over"
                }
              />
            ))}
          </Layer>
          <Layer listening={false}>
            {cursor ? (
              <Circle
                x={cursor.x}
                y={cursor.y}
                radius={size / 2}
                stroke={tool === "eraser" ? "#ffffff" : paint}
                strokeWidth={1.5 / fit.scale}
                dash={tool === "eraser" ? [4 / fit.scale, 4 / fit.scale] : undefined}
              />
            ) : null}
          </Layer>
        </Stage>
      ) : (
        <span className={styles.maskEditor__status}>{t("loadingImage")}</span>
      )}
    </div>
  );
}
