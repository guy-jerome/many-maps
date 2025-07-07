// Utility functions and grid component for DungeonEditor
import React from "react";
import { Line as KonvaLine } from "react-konva";

export const GRID_SIZE = 32;
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 768;

export function snapToGrid(val: number) {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
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
export const CustomGrid: React.FC<{ gridSize: number }> = ({ gridSize }) => {
  const lines = [];
  for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
    lines.push(
      React.createElement(KonvaLine, {
        key: "v-" + x,
        points: [x, 0, x, CANVAS_HEIGHT],
        stroke: "#888",
        strokeWidth: 1,
        listening: false,
      })
    );
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
    lines.push(
      React.createElement(KonvaLine, {
        key: "h-" + y,
        points: [0, y, CANVAS_WIDTH, y],
        stroke: "#888",
        strokeWidth: 1,
        listening: false,
      })
    );
  }
  return React.createElement(React.Fragment, null, ...lines);
};
