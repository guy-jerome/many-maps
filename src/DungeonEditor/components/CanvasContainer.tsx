// src/components/CanvasContainer.tsx
import React from "react";
import { Stage } from "react-konva";

interface Props {
  stageRef: any;
  width: number;
  height: number;
  draggable: boolean;
  children: React.ReactNode;
  onMouseDown: any;
  onMouseMove: any;
  onMouseUp: any;
}
export default function CanvasContainer({
  stageRef,
  width,
  height,
  draggable,
  children,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}: Props) {
  return (
    <div style={{ border: "1px solid #000", width, height }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={draggable}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {children}
      </Stage>
    </div>
  );
}
