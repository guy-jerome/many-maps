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

const GRID_SIZE = 32;
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 768;

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
  | "icon";

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

type Shape =
  | Line
  | Rect
  | Free
  | RoundedRect
  | Triangle
  | Circle
  | Polygon
  | IconShape
  | TextShape;

function snapToGrid(val: number) {
  return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

// ICONS array must be defined before use
const ICONS = [
  { name: "stairs", icon: "🪜" },
  { name: "chest", icon: "🧰" },
  { name: "trap", icon: "☠️" },
  { name: "door", icon: "🚪" },
];

const DungeonEditor: React.FC = () => {
  const [tool, setTool] = React.useState<ToolName>("line");
  const [drawing, setDrawing] = React.useState<Shape | null>(null);
  const [shapes, setShapes] = React.useState<Shape[]>([]);
  const [color, setColor] = React.useState<string>("#222");
  const [iconIndex, setIconIndex] = React.useState(0);
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showGrid, setShowGrid] = React.useState(true);
  const [snapTo, setSnapTo] = React.useState(true);
  const [thickness, setThickness] = React.useState(4);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState<{dx: number, dy: number} | null>(null);
  const stageRef = React.useRef<any>(null);
  const navigate = useNavigate();

  function maybeSnap(val: number) {
    return snapTo ? snapToGrid(val) : val;
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
          ) hit = true;
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
          ) hit = true;
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
        }
        if (hit) {
          setSelectedIndex(i);
          // Calculate drag offset
          let dx = 0, dy = 0;
          const shape = shapes[i];
          if ("x" in shape && "y" in shape) {
            dx = x - (shape as any).x;
            dy = y - (shape as any).y;
          } else if (shape.tool === "line") {
            dx = x - shape.points[0].x;
            dy = y - shape.points[0].y;
          } else if (shape.tool === "free") {
            dx = x - shape.points[0].x;
            dy = y - shape.points[0].y;
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
          setShapes((shapes) => shapes.filter((_, idx) => idx !== i));
          return;
        }
      }
      return;
    }
    if (tool === "icon") {
      setShapes([
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
    }
  };

  const handleMouseMove = (e: any) => {
    if (tool === "select" && selectedIndex !== null && dragOffset) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const x = maybeSnap(pointer.x);
      const y = maybeSnap(pointer.y);
      setShapes((shapes) =>
        shapes.map((s, idx) => {
          if (idx !== selectedIndex) return s;
          if (s.tool === "triangle") {
            // Move all points by the drag delta, preserving tuple
            const dx = x - dragOffset.dx - s.points[0].x;
            const dy = y - dragOffset.dy - s.points[0].y;
            const newPoints: [Point, Point, Point] = [
              { x: s.points[0].x + dx, y: s.points[0].y + dy },
              { x: s.points[1].x + dx, y: s.points[1].y + dy },
              { x: s.points[2].x + dx, y: s.points[2].y + dy },
            ];
            return { ...s, points: newPoints };
          } else if (s.tool === "line") {
            const dx = x - dragOffset.dx - s.points[0].x;
            const dy = y - dragOffset.dy - s.points[0].y;
            const newPoints: [Point, Point] = [
              { x: s.points[0].x + dx, y: s.points[0].y + dy },
              { x: s.points[1].x + dx, y: s.points[1].y + dy },
            ];
            return { ...s, points: newPoints };
          } else if (s.tool === "free") {
            const dx = x - dragOffset.dx - s.points[0].x;
            const dy = y - dragOffset.dy - s.points[0].y;
            return {
              ...s,
              points: s.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy })),
            };
          } else if ("x" in s && "y" in s) {
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
    const x = maybeSnap(pointer.x);
    const y = maybeSnap(pointer.y);
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
    }
  };

  const handleMouseUp = () => {
    if (tool === "select") {
      setDragOffset(null);
      return;
    }
    if (drawing) {
      setShapes([...shapes, drawing]);
      setDrawing(null);
    }
  };

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
          onClick={() => setShapes([])}
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
            style={{ background: "#fafafa", border: "1px solid #ccc" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
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
            {/* Drawing Layer */}
            <Layer>
              {/* Render existing shapes */}
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
                } else if (shape.tool === "line") {
                  return (
                    <KonvaLine
                      key={i}
                      points={[
                        shape.points[0].x,
                        shape.points[0].y,
                        shape.points[1].x,
                        shape.points[1].y,
                      ]}
                      stroke={shape.color}
                      strokeWidth={shape.thickness || thickness}
                      lineCap="round"
                      lineJoin="round"
                      shadowEnabled={isSelected}
                      shadowColor={isSelected ? "#00f" : undefined}
                      shadowBlur={isSelected ? 8 : 0}
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
                      stroke={shape.color}
                      strokeWidth={shape.thickness || thickness}
                      shadowEnabled={isSelected}
                      shadowColor={isSelected ? "#00f" : undefined}
                      shadowBlur={isSelected ? 8 : 0}
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
                      stroke={shape.color}
                      strokeWidth={shape.thickness || thickness}
                      shadowEnabled={isSelected}
                      shadowColor={isSelected ? "#00f" : undefined}
                      shadowBlur={isSelected ? 8 : 0}
                    />
                  );
                } else if (shape.tool === "triangle") {
                  return (
                    <KonvaLine
                      key={i}
                      points={shape.points.flatMap((p) => [p.x, p.y])}
                      closed
                      stroke={shape.color}
                      strokeWidth={shape.thickness || thickness}
                      shadowEnabled={isSelected}
                      shadowColor={isSelected ? "#00f" : undefined}
                      shadowBlur={isSelected ? 8 : 0}
                    />
                  );
                } else if (shape.tool === "circle") {
                  return (
                    <KonvaCircle
                      key={i}
                      x={shape.x}
                      y={shape.y}
                      radius={shape.radius}
                      stroke={shape.color}
                      strokeWidth={shape.thickness || thickness}
                      shadowEnabled={isSelected}
                      shadowColor={isSelected ? "#00f" : undefined}
                      shadowBlur={isSelected ? 8 : 0}
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
                      stroke={poly.color}
                      strokeWidth={poly.thickness || thickness}
                      shadowEnabled={isSelected}
                      shadowColor={isSelected ? "#00f" : undefined}
                      shadowBlur={isSelected ? 8 : 0}
                    />
                  );
                } else if (shape.tool === "free") {
                  return (
                    <KonvaLine
                      key={i}
                      points={shape.points.flatMap((p) => [p.x, p.y])}
                      stroke={shape.color}
                      strokeWidth={shape.thickness || thickness}
                      lineCap="round"
                      lineJoin="round"
                      tension={0.5}
                      globalCompositeOperation="source-over"
                      shadowEnabled={isSelected}
                      shadowColor={isSelected ? "#00f" : undefined}
                      shadowBlur={isSelected ? 8 : 0}
                    />
                  );
                }
                return null;
              })}
              {/* Render current drawing shape */}
              {drawing && drawing.tool === "line" && (
                <KonvaLine
                  points={[
                    drawing.points[0].x,
                    drawing.points[0].y,
                    drawing.points[1].x,
                    drawing.points[1].y,
                  ]}
                  stroke={drawing.color}
                  strokeWidth={drawing.thickness || thickness}
                  dash={[8, 8]}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
              {drawing && drawing.tool === "rect" && (
                <KonvaRect
                  x={drawing.x}
                  y={drawing.y}
                  width={drawing.width}
                  height={drawing.height}
                  stroke={drawing.color}
                  strokeWidth={drawing.thickness || thickness}
                  dash={[8, 8]}
                />
              )}
              {drawing && drawing.tool === "roundedRect" && (
                <KonvaRect
                  x={drawing.x}
                  y={drawing.y}
                  width={drawing.width}
                  height={drawing.height}
                  cornerRadius={drawing.radius}
                  stroke={drawing.color}
                  strokeWidth={drawing.thickness || thickness}
                  dash={[8, 8]}
                />
              )}
              {drawing && drawing.tool === "triangle" && (
                <KonvaLine
                  points={drawing.points.flatMap((p) => [p.x, p.y])}
                  closed
                  stroke={drawing.color}
                  strokeWidth={drawing.thickness || thickness}
                  dash={[8, 8]}
                />
              )}
              {drawing && drawing.tool === "circle" && (
                <KonvaCircle
                  x={drawing.x}
                  y={drawing.y}
                  radius={drawing.radius}
                  stroke={drawing.color}
                  strokeWidth={drawing.thickness || thickness}
                  dash={[8, 8]}
                />
              )}
              {drawing &&
                ["pentagon", "hexagon", "octagon"].includes(drawing.tool) &&
                (() => {
                  const poly = drawing as Polygon;
                  const angle = (2 * Math.PI) / poly.sides;
                  const points = Array.from({ length: poly.sides }, (_, j) => [
                    poly.x + poly.radius * Math.cos(j * angle - Math.PI / 2),
                    poly.y + poly.radius * Math.sin(j * angle - Math.PI / 2),
                  ]).flat();
                  return (
                    <KonvaLine
                      points={points}
                      closed
                      stroke={poly.color}
                      strokeWidth={poly.thickness || thickness}
                      dash={[8, 8]}
                    />
                  );
                })()}
              {drawing && drawing.tool === "free" && (
                <KonvaLine
                  points={drawing.points.flatMap((p) => [p.x, p.y])}
                  stroke={drawing.color}
                  strokeWidth={drawing.thickness || thickness}
                  dash={[4, 4]}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.5}
                  globalCompositeOperation="source-over"
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

// CustomGrid component to draw grid using Konva primitives
const CustomGrid: React.FC = () => {
  const lines = [];
  for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
    lines.push(
      <KonvaLine
        key={"v-" + x}
        points={[x, 0, x, CANVAS_HEIGHT]}
        stroke="#e0e0e0"
        strokeWidth={1}
        listening={false}
      />
    );
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
    lines.push(
      <KonvaLine
        key={"h-" + y}
        points={[0, y, CANVAS_WIDTH, y]}
        stroke="#e0e0e0"
        strokeWidth={1}
        listening={false}
      />
    );
  }
  return <>{lines}</>;
};

// Utility: distance from point to segment
function pointToSegmentDist(
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

export default DungeonEditor;
