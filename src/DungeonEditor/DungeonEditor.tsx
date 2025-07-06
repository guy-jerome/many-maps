import React from "react";
import { Stage, Layer } from "react-konva";
import "./DungeonEditor.css";
import {
  Line as KonvaLine,
  Rect as KonvaRect,
  Circle as KonvaCircle,
  Text as KonvaText,
} from "react-konva";
import { SketchPicker } from "react-color";
import { useNavigate } from "react-router-dom";
import {
  GRID_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  snapToGrid,
  maybeSnap,
  getDoorSnap,
  pointToSegmentDist,
  CustomGrid,
} from "./dungeonUtils";

// Tool types
const TOOL_LIST = [
  { name: "select", icon: "🖱️" },
  { name: "line", icon: "📏" },
  { name: "free", icon: "✏️" },
  { name: "rect", icon: "⬛" },
  { name: "roundedRect", icon: "⬜" },
  { name: "triangle", icon: "🔺" },
  { name: "circle", icon: "⚪" },
  { name: "pentagon", icon: "⬟" },
  { name: "hexagon", icon: "⬢" },
  { name: "octagon", icon: "⯃" },
  { name: "erase", icon: "🧹" },
  { name: "icon", icon: "⭐" },
  { name: "door", icon: "🚪" },
];

type ToolName =
  | "select"
  | "line"
  | "rect"
  | "roundedRect"
  | "triangle"
  | "circle"
  | "pentagon"
  | "hexagon"
  | "octagon"
  | "free"
  | "erase"
  | "icon"
  | "door";

// Add new shape interfaces
interface RoundedRect {
  tool: "roundedRect";
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  color: string;
  thickness?: number;
}
interface Triangle {
  tool: "triangle";
  points: [Point, Point, Point];
  color: string;
  thickness?: number;
}
interface Circle {
  tool: "circle";
  x: number;
  y: number;
  radius: number;
  color: string;
  thickness?: number;
}
interface Polygon {
  tool: "pentagon" | "hexagon" | "octagon";
  x: number;
  y: number;
  radius: number;
  sides: number;
  color: string;
  thickness?: number;
}

// Existing interfaces
interface Point {
  x: number;
  y: number;
}

interface Line {
  tool: "line";
  points: [Point, Point];
  color: string;
  thickness?: number;
}

interface Rect {
  tool: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  thickness?: number;
}

interface Free {
  tool: "free";
  points: Point[];
  color: string;
  thickness?: number;
}

// Add icon shape type
interface IconShape {
  tool: "icon";
  x: number;
  y: number;
  icon: string;
}
interface TextShape {
  tool: "text";
  x: number;
  y: number;
  text: string;
  color: string;
}
interface DoorShape {
  tool: "door";
  x: number;
  y: number;
  orientation: "horizontal" | "vertical";
  width: number;
  height: number;
}

type Shape =
  | Line
  | Rect
  | Free
  | RoundedRect
  | Triangle
  | Circle
  | Polygon
  | IconShape
  | TextShape
  | DoorShape;

// ICONS array must be defined before use
const ICONS = [
  { name: "stairs", icon: "🪜" },
  { name: "chest", icon: "🧰" },
  { name: "trap", icon: "☠️" },
  { name: "door", icon: "🚪" },
];

function DungeonEditor() {
  const [tool, setTool] = React.useState<ToolName>("line");
  const [drawing, setDrawing] = React.useState<Shape | null>(null);
  const [shapes, setShapes] = React.useState<Shape[]>([]);
  const [history, setHistory] = React.useState<Shape[][]>([]);
  const [future, setFuture] = React.useState<Shape[][]>([]);
  const [color, setColor] = React.useState<string>("#222");
  const [iconIndex, setIconIndex] = React.useState(0);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showGrid, setShowGrid] = React.useState(true);
  const [snapTo, setSnapTo] = React.useState(true);
  const [thickness, setThickness] = React.useState(4);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState<{
    dx: number;
    dy: number;
  } | null>(null);
  const stageRef = React.useRef<any>(null);
  const navigate = useNavigate();
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [saveFilename, setSaveFilename] = React.useState("dungeon-map.jpg");

  function maybeSnap(val: number, forDoor = false) {
    if (!snapTo) return val;
    if (forDoor) {
      // Snap to the center of the grid line
      return Math.floor(val / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2;
    }
    return snapToGrid(val);
  }

  function getDoorSnap(
    pointer: { x: number; y: number },
    orientation: "horizontal" | "vertical"
  ) {
    // For horizontal: x center of cell, y between grid lines
    // For vertical: y center of cell, x between grid lines
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

  // Mouse events for drawing and selection
  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const x = maybeSnap(pointer.x);
    const y = maybeSnap(pointer.y);
    if (tool === "select") {
      // Find topmost shape under cursor
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        let hit = false;
        if (shape.tool === "icon") {
          if (
            x >= shape.x - 16 &&
            x <= shape.x + 16 &&
            y >= shape.y - 16 &&
            y <= shape.y + 16
          )
            hit = true;
        } else if (shape.tool === "line") {
          const [p1, p2] = shape.points;
          const dist = pointToSegmentDist(x, y, p1.x, p1.y, p2.x, p2.y);
          if (dist <= (shape.thickness || thickness) + 6) hit = true;
        } else if (shape.tool === "free") {
          for (let j = 0; j < shape.points.length - 1; j++) {
            const p1 = shape.points[j];
            const p2 = shape.points[j + 1];
            const dist = pointToSegmentDist(x, y, p1.x, p1.y, p2.x, p2.y);
            if (dist <= (shape.thickness || thickness) + 6) {
              hit = true;
              break;
            }
          }
        } else if (shape.tool === "rect" || shape.tool === "roundedRect") {
          if (
            x >= shape.x &&
            x <= shape.x + shape.width &&
            y >= shape.y &&
            y <= shape.y + shape.height
          )
            hit = true;
        } else if (shape.tool === "triangle") {
          const pts = shape.points;
          const minX = Math.min(pts[0].x, pts[1].x, pts[2].x);
          const maxX = Math.max(pts[0].x, pts[1].x, pts[2].x);
          const minY = Math.min(pts[0].y, pts[1].y, pts[2].y);
          const maxY = Math.max(pts[0].y, pts[1].y, pts[2].y);
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) hit = true;
        } else if (shape.tool === "circle") {
          const dx = x - shape.x;
          const dy = y - shape.y;
          if (Math.sqrt(dx * dx + dy * dy) <= shape.radius) hit = true;
        } else if (["pentagon", "hexagon", "octagon"].includes(shape.tool)) {
          const poly = shape as Polygon;
          const dx = x - poly.x;
          const dy = y - poly.y;
          if (Math.sqrt(dx * dx + dy * dy) <= poly.radius) hit = true;
        } else if (shape.tool === "door") {
          // Door hit test: check if pointer is inside door rect
          const doorX =
            shape.x -
            (shape.orientation === "horizontal"
              ? shape.width / 2
              : shape.height / 2);
          const doorY =
            shape.y -
            (shape.orientation === "vertical"
              ? shape.width / 2
              : shape.height / 2);
          const doorW =
            shape.orientation === "horizontal" ? shape.width : shape.height;
          const doorH =
            shape.orientation === "vertical" ? shape.width : shape.height;
          if (
            x >= doorX &&
            x <= doorX + doorW &&
            y >= doorY &&
            y <= doorY + doorH
          )
            hit = true;
        }
        if (hit) {
          setSelectedIndex(i);
          // Calculate drag offset
          let dx = 0,
            dy = 0;
          const shape = shapes[i];
          if (shape.tool === "door") {
            dx = x - shape.x;
            dy = y - shape.y;
          } else if ("x" in shape && "y" in shape) {
            dx = x - (shape as any).x;
            dy = y - (shape as any).y;
          } else if (shape.tool === "line") {
            dx = x - shape.points[0].x;
            dy = x - shape.points[0].y;
          } else if (shape.tool === "free") {
            dx = x - shape.points[0].x;
            dy = x - shape.points[0].y;
          }
          setDragOffset({ dx, dy });
          return;
        }
      }
      setSelectedIndex(null);
      setDragOffset(null);
      return;
    }
    if (tool === "erase") {
      // Shape-based erase: remove topmost shape under cursor
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        let hit = false;
        if (shape.tool === "icon") {
          if (
            x >= shape.x - 16 &&
            x <= shape.x + 16 &&
            y >= shape.y - 16 &&
            y <= shape.y + 16
          )
            hit = true;
        } else if (shape.tool === "line") {
          const [p1, p2] = shape.points;
          const dist = pointToSegmentDist(x, y, p1.x, p1.y, p2.x, p2.y);
          if (dist <= (shape.thickness || thickness) + 6) hit = true;
        } else if (shape.tool === "free") {
          for (let j = 0; j < shape.points.length - 1; j++) {
            const p1 = shape.points[j];
            const p2 = shape.points[j + 1];
            const dist = pointToSegmentDist(x, y, p1.x, p1.y, p2.x, p2.y);
            if (dist <= (shape.thickness || thickness) + 6) {
              hit = true;
              break;
            }
          }
        } else if (shape.tool === "rect" || shape.tool === "roundedRect") {
          if (
            x >= shape.x &&
            x <= shape.x + shape.width &&
            y >= shape.y &&
            y <= shape.y + shape.height
          )
            hit = true;
        } else if (shape.tool === "triangle") {
          const pts = shape.points;
          const minX = Math.min(pts[0].x, pts[1].x, pts[2].x);
          const maxX = Math.max(pts[0].x, pts[1].x, pts[2].x);
          const minY = Math.min(pts[0].y, pts[1].y, pts[2].y);
          const maxY = Math.max(pts[0].y, pts[1].y, pts[2].y);
          if (x >= minX && x <= maxX && y >= minY && y <= maxY) hit = true;
        } else if (shape.tool === "circle") {
          const dx = x - shape.x;
          const dy = y - shape.y;
          if (
            Math.sqrt(dx * dx + dy * dy) <=
            shape.radius + (shape.thickness || thickness) / 2
          )
            hit = true;
        } else if (["pentagon", "hexagon", "octagon"].includes(shape.tool)) {
          const poly = shape as Polygon;
          const dx = x - poly.x;
          const dy = y - poly.y;
          if (
            Math.sqrt(dx * dx + dy * dy) <=
            poly.radius + (poly.thickness || thickness) / 2
          )
            hit = true;
        }
        if (hit) {
          pushHistoryAndSetShapes(shapes.filter((_, idx) => idx !== i));
          return;
        }
      }
      return;
    }
    if (tool === "icon") {
      pushHistoryAndSetShapes([
        ...shapes,
        { tool: "icon", x, y, icon: ICONS[iconIndex].icon } as IconShape,
      ]);
      return;
    }
    if (tool === "line") {
      setDrawing({
        tool: "line",
        points: [
          { x, y },
          { x, y },
        ],
        color,
        thickness,
      });
    } else if (tool === "rect") {
      setDrawing({ tool: "rect", x, y, width: 0, height: 0, color, thickness });
    } else if (tool === "roundedRect") {
      setDrawing({
        tool: "roundedRect",
        x,
        y,
        width: 0,
        height: 0,
        radius: 16,
        color,
        thickness,
      });
    } else if (tool === "triangle") {
      setDrawing({
        tool: "triangle",
        points: [
          { x, y },
          { x, y },
          { x, y },
        ],
        color,
        thickness,
      });
    } else if (tool === "circle") {
      setDrawing({ tool: "circle", x, y, radius: 0, color, thickness });
    } else if (["pentagon", "hexagon", "octagon"].includes(tool)) {
      setDrawing({
        tool: tool as "pentagon" | "hexagon" | "octagon",
        x,
        y,
        radius: 0,
        sides: tool === "pentagon" ? 5 : tool === "hexagon" ? 6 : 8,
        color,
        thickness,
      });
    } else if (tool === "free") {
      setDrawing({ tool: "free", points: [{ x, y }], color, thickness });
    } else if (tool === "door") {
      // Place a door at snapped x/y, default orientation horizontal, size 20x8
      let doorX, doorY, orientation;
      if (!snapTo) {
        // Free placement
        doorX = pointer.x;
        doorY = pointer.y;
        orientation = "horizontal";
      } else {
        const snapped = getDoorSnap(pointer, "horizontal");
        doorX = snapped.x;
        doorY = snapped.y;
        orientation = "horizontal";
      }
      setDrawing({
        tool: "door",
        x: doorX,
        y: doorY,
        orientation: orientation,
        width: 20,
        height: 8,
      });
      return;
    }
  };

  const handleMouseMove = (e: any) => {
    if (tool === "select" && selectedIndex !== null && dragOffset) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      // Special case for doors: allow free movement if snapTo is off
      setShapes((shapes) =>
        shapes.map((s, idx) => {
          if (idx !== selectedIndex) return s;
          if (s.tool === "door") {
            if (!snapTo) {
              // Free movement: update x/y directly to pointer (centered)
              return {
                ...s,
                x: pointer.x,
                y: pointer.y,
              };
            } else {
              // Snap to grid: use getDoorSnap and orientation
              let orientation = s.orientation;
              // Optionally, allow orientation to change on drag (like drawing)
              const dx = Math.abs(pointer.x - s.x);
              const dy = Math.abs(pointer.y - s.y);
              if (dx > dy) orientation = "horizontal";
              else if (dy > dx) orientation = "vertical";
              const snapped = getDoorSnap(pointer, orientation);
              return {
                ...s,
                x: snapped.x,
                y: snapped.y,
                orientation,
              };
            }
          } else if (s.tool === "triangle") {
            const x = maybeSnap(pointer.x);
            const y = maybeSnap(pointer.y);
            const dx = x - dragOffset.dx - s.points[0].x;
            const dy = y - dragOffset.dy - s.points[0].y;
            const newPoints: [Point, Point, Point] = [
              { x: s.points[0].x + dx, y: s.points[0].y + dy },
              { x: s.points[1].x + dx, y: s.points[1].y + dy },
              { x: s.points[2].x + dx, y: s.points[2].y + dy },
            ];
            return { ...s, points: newPoints };
          } else if (s.tool === "line") {
            const x = maybeSnap(pointer.x);
            const y = maybeSnap(pointer.y);
            const dx = x - dragOffset.dx - s.points[0].x;
            const dy = y - dragOffset.dy - s.points[0].y;
            const newPoints: [Point, Point] = [
              { x: s.points[0].x + dx, y: s.points[0].y + dy },
              { x: s.points[1].x + dx, y: s.points[1].y + dy },
            ];
            return { ...s, points: newPoints };
          } else if (s.tool === "free") {
            const x = maybeSnap(pointer.x);
            const y = maybeSnap(pointer.y);
            const dx = x - dragOffset.dx - s.points[0].x;
            const dy = y - dragOffset.dy - s.points[0].y;
            return {
              ...s,
              points: s.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
            };
          } else if ("x" in s && "y" in s) {
            const x = maybeSnap(pointer.x);
            const y = maybeSnap(pointer.y);
            return { ...s, x: x - dragOffset.dx, y: y - dragOffset.dy };
          }
          return s;
        })
      );
      return;
    }
    if (!drawing) return;
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    let x = pointer.x;
    let y = pointer.y;
    if (drawing.tool !== "door" && snapTo) {
      x = maybeSnap(pointer.x);
      y = maybeSnap(pointer.y);
    }
    if (drawing.tool === "line") {
      setDrawing({ ...drawing, points: [drawing.points[0], { x, y }] });
    } else if (drawing.tool === "rect") {
      setDrawing({ ...drawing, width: x - drawing.x, height: y - drawing.y });
    } else if (drawing.tool === "roundedRect") {
      setDrawing({ ...drawing, width: x - drawing.x, height: y - drawing.y });
    } else if (drawing.tool === "triangle") {
      // Equilateral triangle from start to current
      const p1 = drawing.points[0];
      const p2 = { x, y };
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const p3 = { x: p1.x - dy, y: p1.y + dx };
      setDrawing({ ...drawing, points: [p1, p2, p3] });
    } else if (drawing.tool === "circle") {
      const dx = x - drawing.x;
      const dy = y - drawing.y;
      setDrawing({ ...drawing, radius: Math.sqrt(dx * dx + dy * dy) });
    } else if (["pentagon", "hexagon", "octagon"].includes(drawing.tool)) {
      // TypeScript: drawing is Polygon
      const poly = drawing as Polygon;
      const dx = x - poly.x;
      const dy = y - poly.y;
      setDrawing({ ...poly, radius: Math.sqrt(dx * dx + dy * dy) });
    } else if (drawing.tool === "free") {
      setDrawing({ ...drawing, points: [...drawing.points, { x, y }] });
    } else if (drawing.tool === "door") {
      // Toggle orientation if user drags far enough vertically or horizontally
      let orientation = drawing.orientation;
      const dx = Math.abs(pointer.x - drawing.x);
      const dy = Math.abs(pointer.y - drawing.y);
      if (dx > dy) orientation = "horizontal";
      else if (dy > dx) orientation = "vertical";
      let doorX = pointer.x;
      let doorY = pointer.y;
      if (snapTo) {
        const snapped = getDoorSnap(pointer, orientation);
        doorX = snapped.x;
        doorY = snapped.y;
      }
      setDrawing({ ...drawing, x: doorX, y: doorY, orientation });
      return;
    }
  };

  const handleMouseUp = () => {
    if (tool === "select") {
      setDragOffset(null);
      return;
    }
    if (drawing) {
      if (drawing.tool === "door") {
        pushHistoryAndSetShapes([...shapes, drawing]);
        setDrawing(null);
        return;
      }
      pushHistoryAndSetShapes([...shapes, drawing]);
      setDrawing(null);
    }
  };

  // Undo/redo handlers
  const handleUndo = () => {
    if (history.length > 0) {
      setFuture((f) => [shapes, ...f]);
      setShapes(history[history.length - 1]);
      setHistory((h) => h.slice(0, h.length - 1));
    }
  };
  const handleRedo = () => {
    if (future.length > 0) {
      setHistory((h) => [...h, shapes]);
      setShapes(future[0]);
      setFuture((f) => f.slice(1));
    }
  };

  // Helper to push to history before shape change
  function pushHistoryAndSetShapes(newShapes: Shape[]) {
    setHistory((h) => [...h, shapes]);
    setShapes(newShapes);
    setFuture([]);
  }

  // Update clear all to push to history
  function handleClearAll() {
    if (shapes.length > 0) {
      pushHistoryAndSetShapes([]);
    }
  }

  // Set cursor style based on tool
  React.useEffect(() => {
    let cursor = "default";
    if (
      tool === "line" ||
      tool === "rect" ||
      tool === "roundedRect" ||
      tool === "triangle" ||
      tool === "circle" ||
      ["pentagon", "hexagon", "octagon"].includes(tool)
    ) {
      cursor = "crosshair";
    } else if (tool === "free") {
      cursor =
        "url('data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text x='0' y='24' font-size='24'>✏️</text></svg>') 0 24, pointer";
    } else if (tool === "erase") {
      cursor =
        "url('data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32'><text x='0' y='24' font-size='24'>🧹</text></svg>') 0 24, pointer";
    } else if (tool === "icon") {
      cursor = "pointer";
    } else if (tool === "select") {
      cursor = "pointer";
    }
    const canvas = document.querySelector(".dungeon-canvas") as HTMLElement;
    if (canvas) canvas.style.cursor = cursor;
  }, [tool]);

  return (
    <div className="dungeon-editor-container">
      {/* Save as JPEG Modal */}
      {showSaveModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowSaveModal(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 20, // reduced from 32
              borderRadius: 8,
              minWidth: 220, // reduced from 320
              maxWidth: 320, // add a maxWidth for compactness
              width: 260, // set a fixed width for consistency
              boxShadow: "0 4px 24px #0003",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, fontSize: 20 }}>Save as JPEG</h2>
            <div
              style={{
                fontSize: 14,
                color: "#333",
                marginBottom: 10,
                lineHeight: 1.4,
              }}
            >
              <div>
                Choose a file name for your exported map. The browser will use
                its default download location, or prompt you for a location if
                your browser settings allow.
              </div>
            </div>
            <label style={{ display: "block", marginBottom: 8, fontSize: 15 }}>
              Filename:
              <input
                type="text"
                value={saveFilename}
                onChange={(e) => setSaveFilename(e.target.value)}
                style={{
                  width: "100%",
                  marginTop: 4,
                  padding: 4,
                  fontSize: 15,
                  boxSizing: "border-box",
                }}
              />
            </label>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <button
                onClick={() => setShowSaveModal(false)}
                style={{
                  padding: "5px 14px",
                  borderRadius: 4,
                  border: "none",
                  background: "#888",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (stageRef.current) {
                    const stage = stageRef.current;
                    const bgLayer = new window.Konva.Layer();
                    const bgRect = new window.Konva.Rect({
                      x: 0,
                      y: 0,
                      width: CANVAS_WIDTH,
                      height: CANVAS_HEIGHT,
                      fill: "#f5ecd6",
                      listening: false,
                    });
                    bgLayer.add(bgRect);
                    stage.add(bgLayer);
                    bgLayer.moveToBottom();
                    stage.draw();
                    const uri = stage.toDataURL({
                      mimeType: "image/jpeg",
                      quality: 1,
                    });
                    bgLayer.destroy();
                    stage.draw();
                    const link = document.createElement("a");
                    link.download =
                      saveFilename.endsWith(".jpg") ||
                      saveFilename.endsWith(".jpeg")
                        ? saveFilename
                        : saveFilename + ".jpg";
                    link.href = uri;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                  setShowSaveModal(false);
                }}
                style={{
                  padding: "5px 14px",
                  borderRadius: 4,
                  border: "none",
                  background: "#2a7",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="dungeon-upperbar">
        <button
          onClick={() => navigate("/")}
          style={{
            margin: 8,
            padding: "4px 16px",
            borderRadius: 4,
            border: "none",
            background: "#444",
            color: "#fff",
            fontWeight: 600,
            fontSize: 18,
            cursor: "pointer",
          }}
        >
          ⟵ Back to Home
        </button>
        <button
          onClick={handleUndo}
          style={{
            margin: 8,
            padding: "4px 16px",
            borderRadius: 4,
            border: "none",
            background: history.length === 0 ? "#888" : "#444",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            cursor: history.length === 0 ? "not-allowed" : "pointer",
            opacity: history.length === 0 ? 0.5 : 1,
          }}
          disabled={history.length === 0}
          title="Undo"
        >
          ↶ Undo
        </button>
        <button
          onClick={handleRedo}
          style={{
            margin: 8,
            padding: "4px 16px",
            borderRadius: 4,
            border: "none",
            background: future.length === 0 ? "#888" : "#444",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            cursor: future.length === 0 ? "not-allowed" : "pointer",
            opacity: future.length === 0 ? 0.5 : 1,
          }}
          disabled={future.length === 0}
          title="Redo"
        >
          ↷ Redo
        </button>
        <button
          onClick={handleClearAll}
          style={{
            margin: 8,
            padding: "4px 16px",
            borderRadius: 4,
            border: "none",
            background: "#c00",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
          }}
          title="Clear all shapes"
        >
          🗑️ Clear All
        </button>
        <button
          className={showGrid ? "active" : ""}
          onClick={() => setShowGrid((v) => !v)}
          style={{
            margin: 8,
            padding: "4px 12px",
            borderRadius: 4,
            border: "none",
            background: showGrid ? "#444" : "#ccc",
            color: showGrid ? "#fff" : "#222",
            cursor: "pointer",
          }}
        >
          {showGrid ? "Hide Grid" : "Show Grid"}
        </button>
        <button
          className={snapTo ? "active" : ""}
          onClick={() => setSnapTo((v) => !v)}
          style={{
            margin: 8,
            padding: "4px 12px",
            borderRadius: 4,
            border: "none",
            background: snapTo ? "#444" : "#ccc",
            color: snapTo ? "#fff" : "#222",
            cursor: "pointer",
          }}
        >
          {snapTo ? "Snap On" : "Snap Off"}
        </button>
        <div style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>
          <label
            htmlFor="thickness-slider"
            style={{ color: "#fff", marginRight: 8 }}
          >
            Line Thickness
          </label>
          <input
            id="thickness-slider"
            type="range"
            min={1}
            max={16}
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            style={{ marginRight: 8 }}
          />
          <span
            style={{ color: "#fff", minWidth: 24, display: "inline-block" }}
          >
            {thickness}
          </span>
        </div>
        <button
          onClick={() => setShowSaveModal(true)}
          style={{
            margin: 8,
            padding: "4px 16px",
            borderRadius: 4,
            border: "none",
            background: "#2a7",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            cursor: "pointer",
          }}
          title="Save as JPEG"
        >
          💾 Save as JPEG
        </button>
        {/* Remove eraser size slider and logic */}
        {/* Add more settings here as needed */}
      </div>
      <div style={{ display: "flex", flex: 1, height: "100%" }}>
        <div
          className="dungeon-toolbar"
          style={{
            flexDirection: "column",
            alignItems: "center",
            width: 112,
            minWidth: 112,
            maxWidth: 112,
            paddingTop: 8,
            position: "relative",
          }}
        >
          {/* Color picker at the very top */}
          <button
            style={{
              background: color,
              width: 36,
              height: 36,
              border: "2px solid #fff",
              borderRadius: 4,
              margin: 8,
              cursor: "pointer",
            }}
            title="Pick color"
            onClick={() => setShowColorPicker((v) => !v)}
          >
            🎨
          </button>
          {showColorPicker && (
            <div
              style={{ position: "fixed", zIndex: 1000, left: 140, top: 80 }}
            >
              <SketchPicker
                color={color}
                onChange={(c: { hex: string }) => {
                  setColor(c.hex);
                }}
                disableAlpha
              />
              <button
                style={{ marginTop: 4, width: "100%" }}
                onClick={() => setShowColorPicker(false)}
              >
                Close
              </button>
            </div>
          )}
          {/* Double wide tool grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 48px)",
              gap: 8,
              margin: 8,
            }}
          >
            {TOOL_LIST.map((t) => (
              <button
                key={t.name}
                className={tool === t.name ? "active" : ""}
                onClick={() => setTool(t.name as ToolName)}
                style={{
                  fontSize: 24,
                  background: tool === t.name ? "#444" : "#222",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  width: 48,
                  height: 48,
                }}
                title={t.name}
              >
                {t.icon}
              </button>
            ))}
          </div>
          {/* Icon selector for icon tool */}
          {tool === "icon" && (
            <div style={{ margin: 8 }}>
              {ICONS.map((ic, idx) => (
                <button
                  key={ic.name}
                  style={{
                    fontSize: 20,
                    margin: 2,
                    background: iconIndex === idx ? "#888" : "#222",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    width: 32,
                    height: 32,
                  }}
                  onClick={() => setIconIndex(idx)}
                  title={ic.name}
                >
                  {ic.icon}
                </button>
              ))}
            </div>
          )}
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stage
            ref={stageRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="dungeon-canvas"
            style={{ background: "#f5ecd6", border: "1px solid #ccc" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Underground + Mask Layer: solid base, then carve-out shapes using destination-out */}
            <Layer id="underground-mask-layer">
              <KonvaRect
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fill="#222"
                listening={false}
              />
              {shapes.map((shape, i) => {
                // Only carve-out shapes (not icons/text)
                if (shape.tool === "icon" || shape.tool === "text") return null;
                if (shape.tool === "line") {
                  return (
                    <KonvaLine
                      key={i}
                      points={[
                        shape.points[0].x,
                        shape.points[0].y,
                        shape.points[1].x,
                        shape.points[1].y,
                      ]}
                      stroke="#fff"
                      strokeWidth={shape.thickness || thickness}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation="destination-out"
                    />
                  );
                } else if (shape.tool === "rect") {
                  return (
                    <KonvaRect
                      key={i}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      fill="#fff"
                      globalCompositeOperation="destination-out"
                    />
                  );
                } else if (shape.tool === "roundedRect") {
                  return (
                    <KonvaRect
                      key={i}
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      cornerRadius={shape.radius}
                      fill="#fff"
                      globalCompositeOperation="destination-out"
                    />
                  );
                } else if (shape.tool === "triangle") {
                  return (
                    <KonvaLine
                      key={i}
                      points={shape.points.flatMap((p) => [p.x, p.y])}
                      closed
                      fill="#fff"
                      globalCompositeOperation="destination-out"
                    />
                  );
                } else if (shape.tool === "circle") {
                  return (
                    <KonvaCircle
                      key={i}
                      x={shape.x}
                      y={shape.y}
                      radius={shape.radius}
                      fill="#fff"
                      globalCompositeOperation="destination-out"
                    />
                  );
                } else if (
                  ["pentagon", "hexagon", "octagon"].includes(shape.tool)
                ) {
                  const poly = shape as Polygon;
                  const angle = (2 * Math.PI) / poly.sides;
                  const points = Array.from({ length: poly.sides }, (_, j) => [
                    poly.x + poly.radius * Math.cos(j * angle - Math.PI / 2),
                    poly.y + poly.radius * Math.sin(j * angle - Math.PI / 2),
                  ]).flat();
                  return (
                    <KonvaLine
                      key={i}
                      points={points}
                      closed
                      fill="#fff"
                      globalCompositeOperation="destination-out"
                    />
                  );
                } else if (shape.tool === "free") {
                  return (
                    <KonvaLine
                      key={i}
                      points={shape.points.flatMap((p) => [p.x, p.y])}
                      stroke="#fff"
                      strokeWidth={shape.thickness || thickness}
                      lineCap="round"
                      lineJoin="round"
                      tension={0.5}
                      globalCompositeOperation="destination-out"
                    />
                  );
                }
                return null;
              })}
              {/* Render current drawing shape as carve-out preview */}
              {drawing &&
                drawing.tool !== "icon" &&
                drawing.tool !== "text" &&
                (() => {
                  if (drawing.tool === "line") {
                    return (
                      <KonvaLine
                        points={[
                          drawing.points[0].x,
                          drawing.points[0].y,
                          drawing.points[1].x,
                          drawing.points[1].y,
                        ]}
                        stroke="#fff"
                        strokeWidth={drawing.thickness || thickness}
                        dash={[8, 8]}
                        lineCap="round"
                        lineJoin="round"
                        globalCompositeOperation="destination-out"
                      />
                    );
                  } else if (drawing.tool === "rect") {
                    return (
                      <KonvaRect
                        x={drawing.x}
                        y={drawing.y}
                        width={drawing.width}
                        height={drawing.height}
                        fill="#fff"
                        dash={[8, 8]}
                        globalCompositeOperation="destination-out"
                      />
                    );
                  } else if (drawing.tool === "roundedRect") {
                    return (
                      <KonvaRect
                        x={drawing.x}
                        y={drawing.y}
                        width={drawing.width}
                        height={drawing.height}
                        cornerRadius={drawing.radius}
                        fill="#fff"
                        dash={[8, 8]}
                        globalCompositeOperation="destination-out"
                      />
                    );
                  } else if (drawing.tool === "triangle") {
                    return (
                      <KonvaLine
                        points={drawing.points.flatMap((p) => [p.x, p.y])}
                        closed
                        fill="#fff"
                        dash={[8, 8]}
                        globalCompositeOperation="destination-out"
                      />
                    );
                  } else if (drawing.tool === "circle") {
                    return (
                      <KonvaCircle
                        x={drawing.x}
                        y={drawing.y}
                        radius={drawing.radius}
                        fill="#fff"
                        dash={[8, 8]}
                        globalCompositeOperation="destination-out"
                      />
                    );
                  } else if (
                    ["pentagon", "hexagon", "octagon"].includes(drawing.tool)
                  ) {
                    const poly = drawing as Polygon;
                    const angle = (2 * Math.PI) / poly.sides;
                    const points = Array.from(
                      { length: poly.sides },
                      (_, j) => [
                        poly.x +
                          poly.radius * Math.cos(j * angle - Math.PI / 2),
                        poly.y +
                          poly.radius * Math.sin(j * angle - Math.PI / 2),
                      ]
                    ).flat();
                    return (
                      <KonvaLine
                        points={points}
                        closed
                        fill="#fff"
                        dash={[8, 8]}
                        globalCompositeOperation="destination-out"
                      />
                    );
                  } else if (drawing.tool === "free") {
                    return (
                      <KonvaLine
                        points={drawing.points.flatMap((p) => [p.x, p.y])}
                        stroke="#fff"
                        strokeWidth={drawing.thickness || thickness}
                        dash={[4, 4]}
                        lineCap="round"
                        lineJoin="round"
                        tension={0.5}
                        globalCompositeOperation="destination-out"
                      />
                    );
                  }
                  return null;
                })()}
            </Layer>
            {/* Grid Layer (top, only visible in carved-out areas) */}
            {showGrid && (
              <Layer
                listening={false}
                hitStrokeWidth={0}
                perfectDrawEnabled={false}
                id="grid-layer"
              >
                <React.Fragment>
                  <CustomGrid />
                </React.Fragment>
              </Layer>
            )}
            {/* Icon/Text Layer (above mask) */}
            <Layer id="icon-layer">
              {shapes.map((shape, i) => {
                const isSelected = tool === "select" && i === selectedIndex;
                if (shape.tool === "icon") {
                  const iconShape = shape as IconShape;
                  return (
                    <KonvaText
                      key={i}
                      x={iconShape.x}
                      y={iconShape.y}
                      text={iconShape.icon}
                      fontSize={32}
                      fontStyle="bold"
                      fill="#222"
                      offsetX={16}
                      offsetY={16}
                      shadowEnabled={isSelected}
                      shadowColor={isSelected ? "#00f" : undefined}
                      shadowBlur={isSelected ? 8 : 0}
                    />
                  );
                }
                if (shape.tool === "door") {
                  // Draw a filled rectangle for the door (above mask)
                  return (
                    <KonvaRect
                      key={i}
                      x={
                        shape.x -
                        (shape.orientation === "horizontal"
                          ? shape.width / 2
                          : shape.height / 2)
                      }
                      y={
                        shape.y -
                        (shape.orientation === "vertical"
                          ? shape.width / 2
                          : shape.height / 2)
                      }
                      width={
                        shape.orientation === "horizontal"
                          ? shape.width
                          : shape.height
                      }
                      height={
                        shape.orientation === "vertical"
                          ? shape.width
                          : shape.height
                      }
                      fill="#fff"
                      stroke="#222"
                      strokeWidth={2}
                      shadowEnabled={isSelected}
                      shadowColor={isSelected ? "#00f" : undefined}
                      shadowBlur={isSelected ? 8 : 0}
                    />
                  );
                }
                // Add text support here if needed
                return null;
              })}
              {/* Door preview while drawing */}
              {drawing && drawing.tool === "door" && (
                <KonvaRect
                  x={
                    drawing.x -
                    (drawing.orientation === "horizontal"
                      ? drawing.width / 2
                      : drawing.height / 2)
                  }
                  y={
                    drawing.y -
                    (drawing.orientation === "vertical"
                      ? drawing.width / 2
                      : drawing.height / 2)
                  }
                  width={
                    drawing.orientation === "horizontal"
                      ? drawing.width
                      : drawing.height
                  }
                  height={
                    drawing.orientation === "vertical"
                      ? drawing.width
                      : drawing.height
                  }
                  fill="#fff"
                  stroke="#222"
                  strokeWidth={2}
                  dash={[4, 4]}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}

export default DungeonEditor;
