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

// Calculate distance from point to line segment
export function pointToSegmentDist(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length2 = dx * dx + dy * dy;
  
  if (length2 === 0) {
    // Line segment is actually a point
    const dpx = px - x1;
    const dpy = py - y1;
    return Math.sqrt(dpx * dpx + dpy * dpy);
  }
  
  // Calculate the parameter t that represents the position along the line segment
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / length2));
  
  // Find the closest point on the line segment
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  
  // Return distance from point to closest point on segment
  const distX = px - closestX;
  const distY = py - closestY;
  return Math.sqrt(distX * distX + distY * distY);
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

// Snap rotation to 15-degree increments when snap-to-grid is enabled
export function snapRotation(angle: number, snapToGrid: boolean): number {
  if (!snapToGrid) return angle;
  
  // Convert radians to degrees
  const degrees = (angle * 180) / Math.PI;
  
  // Snap to 15-degree increments
  const snapIncrement = 15;
  const snappedDegrees = Math.round(degrees / snapIncrement) * snapIncrement;
  
  // Convert back to radians
  return (snappedDegrees * Math.PI) / 180;
}

// Helper function to rotate a point around a center
function rotatePoint(point: { x: number; y: number }, center: { x: number; y: number }, angle: number): { x: number; y: number } {
  if (!angle) return point;
  
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}

// Helper function to get cursor for rotated handle
function getRotatedCursor(originalCursor: string, rotation: number): string {
  if (!rotation || originalCursor === 'crosshair') return originalCursor;
  
  // Convert rotation to approximate 45-degree increments
  const degrees = (rotation * 180 / Math.PI) % 360;
  const normalizedDegrees = degrees < 0 ? degrees + 360 : degrees;
  const increment = Math.round(normalizedDegrees / 45);
  
  const cursorMap: { [key: string]: string[] } = {
    'nw-resize': ['nw-resize', 'n-resize', 'ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize'],
    'ne-resize': ['ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize', 'nw-resize', 'n-resize'],
    'se-resize': ['se-resize', 's-resize', 'sw-resize', 'w-resize', 'nw-resize', 'n-resize', 'ne-resize', 'e-resize'],
    'sw-resize': ['sw-resize', 'w-resize', 'nw-resize', 'n-resize', 'ne-resize', 'e-resize', 'se-resize', 's-resize'],
    'ns-resize': ['ns-resize', 'nw-resize', 'ew-resize', 'ne-resize', 'ns-resize', 'se-resize', 'ew-resize', 'sw-resize'],
    'ew-resize': ['ew-resize', 'ne-resize', 'ns-resize', 'se-resize', 'ew-resize', 'sw-resize', 'ns-resize', 'nw-resize']
  };
  
  const cursors = cursorMap[originalCursor];
  return cursors ? cursors[increment % 8] : originalCursor;
}

// Resize handle utilities
export function getResizeHandles(shape: any): Array<{ x: number; y: number; cursor: string; type: string }> {
  if (shape.tool === 'icon') {
    // Icons can now be resized - use corner handles around the icon bounds
    const size = shape.size || 32; // Use actual icon size or default to 32
    const handles = [
      { x: shape.x - size/2, y: shape.y - size/2, cursor: 'nw-resize', type: 'icon-nw' },
      { x: shape.x + size/2, y: shape.y - size/2, cursor: 'ne-resize', type: 'icon-ne' },
      { x: shape.x + size/2, y: shape.y + size/2, cursor: 'se-resize', type: 'icon-se' },
      { x: shape.x - size/2, y: shape.y + size/2, cursor: 'sw-resize', type: 'icon-sw' }
    ];
    
    // Apply rotation if the shape has rotation
    if (shape.rotation) {
      const center = { x: shape.x, y: shape.y };
      return handles.map((handle: any) => ({
        ...handle,
        ...rotatePoint(handle, center, shape.rotation),
        cursor: getRotatedCursor(handle.cursor, shape.rotation)
      }));
    }
    
    return handles;
  }
  
  if (shape.tool === 'text') {
    // Text doesn't have resize handles
    return [];
  }
  
  if (shape.tool === 'line') {
    // Line has handles at both endpoints
    const [p1, p2] = shape.points;
    const handles = [
      { x: p1.x, y: p1.y, cursor: 'crosshair', type: 'line-start' },
      { x: p2.x, y: p2.y, cursor: 'crosshair', type: 'line-end' }
    ];
    
    // Apply rotation if the shape has rotation
    if (shape.rotation) {
      const center = getShapeCenter(shape);
      return handles.map((handle: any) => ({
        ...handle,
        ...rotatePoint(handle, center, shape.rotation)
      }));
    }
    
    return handles;
  }
  
  if (shape.tool === 'circle') {
    // Circle has handles at cardinal directions
    const handles = [
      { x: shape.x + shape.radius, y: shape.y, cursor: 'ew-resize', type: 'circle-e' },
      { x: shape.x - shape.radius, y: shape.y, cursor: 'ew-resize', type: 'circle-w' },
      { x: shape.x, y: shape.y + shape.radius, cursor: 'ns-resize', type: 'circle-s' },
      { x: shape.x, y: shape.y - shape.radius, cursor: 'ns-resize', type: 'circle-n' }
    ];
    
    // Apply rotation if the shape has rotation
    if (shape.rotation) {
      const center = { x: shape.x, y: shape.y };
      return handles.map((handle: any) => ({
        ...handle,
        ...rotatePoint(handle, center, shape.rotation),
        cursor: getRotatedCursor(handle.cursor, shape.rotation)
      }));
    }
    
    return handles;
  }
  
  if (shape.tool === 'rect' || shape.tool === 'roundedRect') {
    const norm = normalizeRectCoords(shape.x, shape.y, shape.width, shape.height);
    const handles = [
      // Corner handles
      { x: norm.x, y: norm.y, cursor: 'nw-resize', type: 'corner-nw' },
      { x: norm.x + norm.width, y: norm.y, cursor: 'ne-resize', type: 'corner-ne' },
      { x: norm.x + norm.width, y: norm.y + norm.height, cursor: 'se-resize', type: 'corner-se' },
      { x: norm.x, y: norm.y + norm.height, cursor: 'sw-resize', type: 'corner-sw' },
      // Edge handles
      { x: norm.x + norm.width / 2, y: norm.y, cursor: 'ns-resize', type: 'edge-n' },
      { x: norm.x + norm.width, y: norm.y + norm.height / 2, cursor: 'ew-resize', type: 'edge-e' },
      { x: norm.x + norm.width / 2, y: norm.y + norm.height, cursor: 'ns-resize', type: 'edge-s' },
      { x: norm.x, y: norm.y + norm.height / 2, cursor: 'ew-resize', type: 'edge-w' }
    ];
    
    // Apply rotation if the shape has rotation
    if (shape.rotation) {
      const center = getShapeCenter(shape);
      return handles.map((handle: any) => ({
        ...handle,
        ...rotatePoint(handle, center, shape.rotation),
        cursor: getRotatedCursor(handle.cursor, shape.rotation)
      }));
    }
    
    return handles;
  }
  
  if (shape.tool === 'triangle') {
    // Triangle has handles at each vertex
    const handles = shape.points.map((point: any, index: number) => ({
      x: point.x,
      y: point.y,
      cursor: 'crosshair',
      type: `triangle-${index}`
    }));
    
    // Apply rotation if the shape has rotation
    if (shape.rotation) {
      const center = getShapeCenter(shape);
      return handles.map((handle: any) => ({
        ...handle,
        ...rotatePoint(handle, center, shape.rotation)
      }));
    }
    
    return handles;
  }
  
  if (['pentagon', 'hexagon', 'octagon'].includes(shape.tool)) {
    // Polygons have a radius handle
    const poly = shape as any;
    const handles = [
      { x: poly.x + poly.radius, y: poly.y, cursor: 'ew-resize', type: 'polygon-radius' }
    ];
    
    // Apply rotation if the shape has rotation
    if (shape.rotation) {
      const center = { x: poly.x, y: poly.y };
      return handles.map((handle: any) => ({
        ...handle,
        ...rotatePoint(handle, center, shape.rotation),
        cursor: getRotatedCursor(handle.cursor, shape.rotation)
      }));
    }
    
    return handles;
  }
  
  if (shape.tool === 'door') {
    // Door has resize handles for width and height adjustment
    const doorW = shape.orientation === "horizontal" ? Math.abs(shape.width) : Math.abs(shape.height);
    const doorH = shape.orientation === "horizontal" ? Math.abs(shape.height) : Math.abs(shape.width);
    
    // Ensure minimum handle positioning
    const actualDoorW = Math.max(8, doorW);
    const actualDoorH = Math.max(4, doorH);
    
    const handles = [
      // Corner handles
      { x: shape.x - actualDoorW/2, y: shape.y - actualDoorH/2, cursor: 'nw-resize', type: 'door-nw' },
      { x: shape.x + actualDoorW/2, y: shape.y - actualDoorH/2, cursor: 'ne-resize', type: 'door-ne' },
      { x: shape.x + actualDoorW/2, y: shape.y + actualDoorH/2, cursor: 'se-resize', type: 'door-se' },
      { x: shape.x - actualDoorW/2, y: shape.y + actualDoorH/2, cursor: 'sw-resize', type: 'door-sw' },
      // Edge handles
      { x: shape.x, y: shape.y - actualDoorH/2, cursor: 'ns-resize', type: 'door-n' },
      { x: shape.x + actualDoorW/2, y: shape.y, cursor: 'ew-resize', type: 'door-e' },
      { x: shape.x, y: shape.y + actualDoorH/2, cursor: 'ns-resize', type: 'door-s' },
      { x: shape.x - actualDoorW/2, y: shape.y, cursor: 'ew-resize', type: 'door-w' }
    ];
    
    // Apply rotation if the shape has rotation
    if (shape.rotation) {
      const center = { x: shape.x, y: shape.y };
      return handles.map((handle: any) => ({
        ...handle,
        ...rotatePoint(handle, center, shape.rotation),
        cursor: getRotatedCursor(handle.cursor, shape.rotation)
      }));
    }
    
    return handles;
  }
  
  if (shape.tool === 'free') {
    // Free form shapes could have handles at key points, but for simplicity we'll skip
    return [];
  }
  
  return [];
}

export function getResizeHandleAtPoint(shape: any, x: number, y: number, tolerance = 8): { type: string; cursor: string } | null {
  const handles = getResizeHandles(shape);
  
  for (const handle of handles) {
    const distance = Math.sqrt(Math.pow(x - handle.x, 2) + Math.pow(y - handle.y, 2));
    if (distance <= tolerance) {
      return { type: handle.type, cursor: handle.cursor };
    }
  }
  
  return null;
}

// Apply resize transformation based on handle type and delta movement
export function applyResize(originalShape: any, handleType: string, deltaX: number, deltaY: number, snapTo: boolean): any {
  const snap = (val: number) => snapTo ? snapToGrid(val) : val;
  
  if (originalShape.tool === 'icon') {
    // For icons, we'll scale by maintaining a size property
    let newSize = originalShape.size || 32; // Default icon size
    
    switch (handleType) {
      case 'icon-nw':
        // Scale based on distance from center - use negative deltas to expand
        const scaleFactor = Math.max(0.1, 1 + (Math.max(-deltaX, -deltaY) / newSize));
        newSize = Math.max(8, newSize * scaleFactor);
        break;
      case 'icon-ne':
        const scaleFactorNE = Math.max(0.1, 1 + (Math.max(deltaX, -deltaY) / newSize));
        newSize = Math.max(8, newSize * scaleFactorNE);
        break;
      case 'icon-se':
        const scaleFactorSE = Math.max(0.1, 1 + (Math.max(deltaX, deltaY) / newSize));
        newSize = Math.max(8, newSize * scaleFactorSE);
        break;
      case 'icon-sw':
        const scaleFactorSW = Math.max(0.1, 1 + (Math.max(-deltaX, deltaY) / newSize));
        newSize = Math.max(8, newSize * scaleFactorSW);
        break;
    }
    
    return { ...originalShape, size: snap(newSize) };
  }
  
  if (originalShape.tool === 'rect' || originalShape.tool === 'roundedRect') {
    const norm = normalizeRectCoords(originalShape.x, originalShape.y, originalShape.width, originalShape.height);
    let newX = norm.x;
    let newY = norm.y;
    let newWidth = norm.width;
    let newHeight = norm.height;
    
    switch (handleType) {
      case 'corner-nw':
        newX = snap(norm.x + deltaX);
        newY = snap(norm.y + deltaY);
        newWidth = norm.width - (newX - norm.x);
        newHeight = norm.height - (newY - norm.y);
        break;
      case 'corner-ne':
        newY = snap(norm.y + deltaY);
        newWidth = snap(norm.width + deltaX);
        newHeight = norm.height - (newY - norm.y);
        break;
      case 'corner-se':
        newWidth = snap(norm.width + deltaX);
        newHeight = snap(norm.height + deltaY);
        break;
      case 'corner-sw':
        newX = snap(norm.x + deltaX);
        newWidth = norm.width - (newX - norm.x);
        newHeight = snap(norm.height + deltaY);
        break;
      case 'edge-n':
        newY = snap(norm.y + deltaY);
        newHeight = norm.height - (newY - norm.y);
        break;
      case 'edge-e':
        newWidth = snap(norm.width + deltaX);
        break;
      case 'edge-s':
        newHeight = snap(norm.height + deltaY);
        break;
      case 'edge-w':
        newX = snap(norm.x + deltaX);
        newWidth = norm.width - (newX - norm.x);
        break;
    }
    
    // Ensure minimum size
    if (newWidth < 10) {
      if (handleType.includes('w')) newX = norm.x + norm.width - 10;
      newWidth = 10;
    }
    if (newHeight < 10) {
      if (handleType.includes('n')) newY = norm.y + norm.height - 10;
      newHeight = 10;
    }
    
    return { ...originalShape, x: newX, y: newY, width: newWidth, height: newHeight };
  }
  
  if (originalShape.tool === 'circle') {
    let newRadius = originalShape.radius;
    
    switch (handleType) {
      case 'circle-e':
      case 'circle-w':
        newRadius = Math.abs(originalShape.radius + (handleType === 'circle-e' ? deltaX : -deltaX));
        break;
      case 'circle-n':
      case 'circle-s':
        newRadius = Math.abs(originalShape.radius + (handleType === 'circle-s' ? deltaY : -deltaY));
        break;
    }
    
    return { ...originalShape, radius: Math.max(5, newRadius) };
  }
  
  if (originalShape.tool === 'line') {
    const newPoints = [...originalShape.points];
    
    if (handleType === 'line-start') {
      newPoints[0] = { x: snap(originalShape.points[0].x + deltaX), y: snap(originalShape.points[0].y + deltaY) };
    } else if (handleType === 'line-end') {
      newPoints[1] = { x: snap(originalShape.points[1].x + deltaX), y: snap(originalShape.points[1].y + deltaY) };
    }
    
    return { ...originalShape, points: newPoints };
  }
  
  if (originalShape.tool === 'triangle') {
    const newPoints = [...originalShape.points];
    const index = parseInt(handleType.split('-')[1]);
    
    if (index >= 0 && index < newPoints.length) {
      newPoints[index] = { 
        x: snap(originalShape.points[index].x + deltaX), 
        y: snap(originalShape.points[index].y + deltaY) 
      };
    }
    
    return { ...originalShape, points: newPoints };
  }
  
  if (originalShape.tool === 'door') {
    // Door resizing - doors are center-positioned, so we need to adjust both size and position
    let newWidth = originalShape.width;
    let newHeight = originalShape.height;
    let newX = originalShape.x;
    let newY = originalShape.y;
    
    // Reasonable minimum sizes for doors
    const minWidth = 8;
    const minHeight = 4;
    
    switch (handleType) {
      case 'door-nw':
        // Top-left corner: decrease width/height, adjust center position
        newWidth = Math.max(minWidth, originalShape.width - deltaX);
        newHeight = Math.max(minHeight, originalShape.height - deltaY);
        newX = originalShape.x - (newWidth - originalShape.width) / 2;
        newY = originalShape.y - (newHeight - originalShape.height) / 2;
        break;
      case 'door-ne':
        // Top-right corner: increase width, decrease height, adjust center position
        newWidth = Math.max(minWidth, originalShape.width + deltaX);
        newHeight = Math.max(minHeight, originalShape.height - deltaY);
        newX = originalShape.x + (newWidth - originalShape.width) / 2;
        newY = originalShape.y - (newHeight - originalShape.height) / 2;
        break;
      case 'door-se':
        // Bottom-right corner: increase both, adjust center position
        newWidth = Math.max(minWidth, originalShape.width + deltaX);
        newHeight = Math.max(minHeight, originalShape.height + deltaY);
        newX = originalShape.x + (newWidth - originalShape.width) / 2;
        newY = originalShape.y + (newHeight - originalShape.height) / 2;
        break;
      case 'door-sw':
        // Bottom-left corner: decrease width, increase height, adjust center position
        newWidth = Math.max(minWidth, originalShape.width - deltaX);
        newHeight = Math.max(minHeight, originalShape.height + deltaY);
        newX = originalShape.x - (newWidth - originalShape.width) / 2;
        newY = originalShape.y + (newHeight - originalShape.height) / 2;
        break;
      case 'door-n':
        // Top edge: decrease height, adjust center Y
        newHeight = Math.max(minHeight, originalShape.height - deltaY);
        newY = originalShape.y - (newHeight - originalShape.height) / 2;
        break;
      case 'door-s':
        // Bottom edge: increase height, adjust center Y
        newHeight = Math.max(minHeight, originalShape.height + deltaY);
        newY = originalShape.y + (newHeight - originalShape.height) / 2;
        break;
      case 'door-e':
        // Right edge: increase width, adjust center X
        newWidth = Math.max(minWidth, originalShape.width + deltaX);
        newX = originalShape.x + (newWidth - originalShape.width) / 2;
        break;
      case 'door-w':
        // Left edge: decrease width, adjust center X
        newWidth = Math.max(minWidth, originalShape.width - deltaX);
        newX = originalShape.x - (newWidth - originalShape.width) / 2;
        break;
    }
    
    // Ensure the final values are valid (positive numbers)
    const finalWidth = Math.max(minWidth, newWidth);
    const finalHeight = Math.max(minHeight, newHeight);
    
    return { 
      ...originalShape, 
      x: snap(newX),
      y: snap(newY),
      width: snap(finalWidth), 
      height: snap(finalHeight) 
    };
  }
  
  if (['pentagon', 'hexagon', 'octagon'].includes(originalShape.tool)) {
    if (handleType === 'polygon-radius') {
      const newRadius = Math.max(5, originalShape.radius + deltaX);
      return { ...originalShape, radius: newRadius };
    }
  }
  
  return originalShape;
}

// CustomGrid component to draw grid using Konva primitives
export const CustomGrid: React.FC<{
  gridSize: number;
  width: number;
  height: number;
  globalCompositeOperation?: string;
  strokeColor?: string;
}> = ({ gridSize, width, height, globalCompositeOperation, strokeColor = "#888" }) => {
  const lines = [];
  for (let x = 0; x <= width; x += gridSize) {
    lines.push(
      React.createElement(KonvaLine, {
        key: "v-" + x,
        points: [x, 0, x, height],
        stroke: strokeColor,
        strokeWidth: 1,
        listening: false,
        globalCompositeOperation: globalCompositeOperation as any,
      })
    );
  }
  for (let y = 0; y <= height; y += gridSize) {
    lines.push(
      React.createElement(KonvaLine, {
        key: "h-" + y,
        points: [0, y, width, y],
        stroke: strokeColor,
        strokeWidth: 1,
        listening: false,
        globalCompositeOperation: globalCompositeOperation as any,
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
