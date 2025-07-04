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
  { name: "fill", icon: "🪣" },
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
  | "fill"
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
  const [eraserStrokes, setEraserStrokes] = React.useState<
    { points: number[]; size: number }[]
  >([]);
  const [isErasing, setIsErasing] = React.useState(false);
  const [eraserSize, setEraserSize] = React.useState(24);
  const stageRef = React.useRef<any>(null);
  const navigate = useNavigate();

  function maybeSnap(val: number) {
    return snapTo ? snapToGrid(val) : val;
  }

  // Mouse events for drawing
  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const x = maybeSnap(pointer.x);
    const y = maybeSnap(pointer.y);
    if (tool === "erase") {
      setIsErasing(true);
      setEraserStrokes((prev) => [
        ...prev,
        { points: [x, y], size: eraserSize },
      ]);
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
    if (tool === "erase" && isErasing) {
      const stage = e.target.getStage();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const x = maybeSnap(pointer.x);
      const y = maybeSnap(pointer.y);
      setEraserStrokes((prev) => {
        const last = prev[prev.length - 1];
        if (!last) return prev;
        // Add to last stroke
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...last,
          points: [...last.points, x, y],
        };
        return updated;
      });
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
    if (tool === "erase" && isErasing) {
      setIsErasing(false);
      return;
    }
    if (drawing) {
      setShapes([...shapes, drawing]);
      setDrawing(null);
    }
  };

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
        {tool === "erase" && (
          <div
            style={{ display: "flex", alignItems: "center", marginLeft: 16 }}
          >
            <label
              htmlFor="eraser-size-slider"
              style={{ color: "#fff", marginRight: 8 }}
            >
              Eraser Size
            </label>
            <input
              id="eraser-size-slider"
              type="range"
              min={4}
              max={64}
              value={eraserSize}
              onChange={(e) => setEraserSize(Number(e.target.value))}
              style={{ marginRight: 8 }}
            />
            <span
              style={{ color: "#fff", minWidth: 24, display: "inline-block" }}
            >
              {eraserSize}
            </span>
          </div>
        )}
        {/* Add more settings here as needed */}
      </div>
      <div style={{ display: "flex", flex: 1, height: "100%" }}>
        <div className="dungeon-toolbar">
          {TOOL_LIST.map((t) => (
            <button
              key={t.name}
              className={tool === t.name ? "active" : ""}
              onClick={() => setTool(t.name as ToolName)}
              style={{
                fontSize: 24,
                margin: 8,
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
              style={{ position: "absolute", zIndex: 10, left: 90, top: 16 }}
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
                      fill={(shape as any).fill || ""}
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
                      fill={(shape as any).fill || ""}
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
                      fill={(shape as any).fill || ""}
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
                      fill={(shape as any).fill || ""}
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
                      fill={(poly as any).fill || ""}
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
                  fill=""
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
                  fill=""
                />
              )}
              {drawing && drawing.tool === "triangle" && (
                <KonvaLine
                  points={drawing.points.flatMap((p) => [p.x, p.y])}
                  closed
                  stroke={drawing.color}
                  strokeWidth={drawing.thickness || thickness}
                  dash={[8, 8]}
                  fill=""
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
                  fill=""
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
                      fill=""
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
            {/* Pixel Erase Layer */}
            <Layer globalCompositeOperation="destination-out">
              {eraserStrokes.map((stroke, i) => (
                <KonvaLine
                  key={i}
                  points={stroke.points}
                  stroke="#000"
                  strokeWidth={stroke.size}
                  lineCap="round"
                  lineJoin="round"
                  tension={0.5}
                  globalCompositeOperation="destination-out"
                />
              ))}
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

export default DungeonEditor;
