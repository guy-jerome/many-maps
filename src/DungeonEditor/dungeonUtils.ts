// Utility functions and grid component for DungeonEditor
import React from "react";
import { Line as KonvaLine } from "react-konva";

export const GRID_SIZE = 32;
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 768;

export function snapToGrid(val: number) {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function normalizeRectCoords(x: number, y: number, width: number, height: number): NormalizedRect {
  const normalized = {
    x: width < 0 ? x + width : x,
    y: height < 0 ? y + height : y,
    width: Math.abs(width),
    height: Math.abs(height),
  };
  return normalized;
}

// Rotation utilities
export function getShapeCenter(shape: any): { x: number; y: number } {
  if (shape.tool === "line") {
    const [p1, p2] = shape.points;
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
  } else if (shape.tool === "triangle") {
    const pts = shape.points;
    return {
      x: (pts[0].x + pts[1].x + pts[2].x) / 3,
      y: (pts[0].y + pts[1].y + pts[2].y) / 3,
    };
  } else if (shape.tool === "free") {
    if (shape.points.length === 0) return { x: 0, y: 0 };
    const sum = shape.points.reduce((acc: { x: number; y: number }, p: { x: number; y: number }) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / shape.points.length, y: sum.y / shape.points.length };
  } else if (shape.tool === "rect" || shape.tool === "roundedRect") {
    const norm = normalizeRectCoords(shape.x, shape.y, shape.width, shape.height);
    return { x: norm.x + norm.width / 2, y: norm.y + norm.height / 2 };
  } else if ("x" in shape && "y" in shape) {
    return { x: shape.x, y: shape.y };
  }
  return { x: 0, y: 0 };
}

export function getRotationHandlePosition(shape: any): { x: number; y: number } {
  const center = getShapeCenter(shape);
  const distance = 40; // Distance from center to rotation handle
  return { x: center.x, y: center.y - distance };
}

export function calculateAngle(center: { x: number; y: number }, point: { x: number; y: number }): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

export function maybeSnap(val: number, snapTo: boolean, forDoor = false) {
  if (!snapTo) return val;
  if (forDoor) {
    // Snap to the center of the grid line
    return Math.floor(val / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
  }
  return snapToGrid(val);
}

export function getDoorSnap(
  pointer: { x: number; y: number },
  orientation: "horizontal" | "vertical"
) {
  if (orientation === "horizontal") {
    return {
      x: Math.floor(pointer.x / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2,
      y: Math.floor(pointer.y / GRID_SIZE) * GRID_SIZE + GRID_SIZE,
    };
  } else {
    return {
      x: Math.floor(pointer.x / GRID_SIZE) * GRID_SIZE + GRID_SIZE,
      y: Math.floor(pointer.y / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2,
    };
  }
}

// Utility: distance from point to segment
export function pointToSegmentDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;
  let xx, yy;
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  const dx = px - xx;
  const dy = py - yy;
  return Math.sqrt(dx * dx + dy * dy);
}

// CustomGrid component to draw grid using Konva primitives
export const CustomGrid: React.FC<{
  gridSize: number;
  width: number;
  height: number;
}> = ({ gridSize, width, height }) => {
  const lines = [];
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      React.createElement(KonvaLine, {
        key: "v-" + x,
        points: [x, 0, x, height],
        stroke: "#888",
        strokeWidth: 1,
        listening: false,
      })
    );
  }
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      React.createElement(KonvaLine, {
        key: "h-" + y,
        points: [0, y, width, y],
        stroke: "#888",
        strokeWidth: 1,
        listening: false,
      })
    );
  }
  return React.createElement(React.Fragment, null, ...lines);
};

export function applyRotationTransform(shape: any, konvaComponent: any) {
  if (!shape.rotation) return konvaComponent;
  
  const center = getShapeCenter(shape);
  return React.cloneElement(konvaComponent, {
    ...konvaComponent.props,
    rotation: (shape.rotation * 180) / Math.PI,
    offsetX: center.x - (konvaComponent.props.x || 0),
    offsetY: center.y - (konvaComponent.props.y || 0),
    x: center.x,
    y: center.y,
  });
}
