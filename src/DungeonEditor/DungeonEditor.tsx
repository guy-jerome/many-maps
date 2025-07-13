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
import { useNavigate, useParams } from "react-router-dom";
import Konva from "konva";
import {
  GRID_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  pointToSegmentDist,
  CustomGrid,
  normalizeRectCoords,
  getShapeCenter,
  getRotationHandlePosition,
  calculateAngle,
  snapRotation,
  getResizeHandles,
  getResizeHandleAtPoint,
  applyResize,
} from "./dungeonUtils";
import {
  saveDungeonProject,
  getDungeonProject,
  getAllDungeonProjects,
  deleteDungeonProject,
  exportDungeonToGallery,
  DungeonProject,
} from "../idbService";

// Tool types - moved icon to bottom
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
  { name: "door", icon: "🚪" },
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
  rotation?: number; // Add rotation support
  drawingMode?: boolean; // Add drawing mode tracking
}
interface Triangle {
  tool: "triangle";
  points: [Point, Point, Point];
  color: string;
  thickness?: number;
  rotation?: number; // Add rotation support
  drawingMode?: boolean; // Add drawing mode tracking
}
interface Circle {
  tool: "circle";
  x: number;
  y: number;
  radius: number;
  color: string;
  thickness?: number;
  rotation?: number; // Add rotation support (for consistency)
  drawingMode?: boolean; // Add drawing mode tracking
}
interface Polygon {
  tool: "pentagon" | "hexagon" | "octagon";
  x: number;
  y: number;
  radius: number;
  sides: number;
  color: string;
  thickness?: number;
  rotation?: number; // Add rotation support
  drawingMode?: boolean; // Add drawing mode tracking
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
  rotation?: number; // Add rotation support
  drawingMode?: boolean; // Add drawing mode tracking
}

interface Rect {
  tool: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  thickness?: number;
  rotation?: number; // Add rotation support
  drawingMode?: boolean; // Add drawing mode tracking
}

interface Free {
  tool: "free";
  points: Point[];
  color: string;
  thickness?: number;
  rotation?: number; // Add rotation support
  drawingMode?: boolean; // Add drawing mode tracking
}

// Add icon shape type
interface IconShape {
  tool: "icon";
  x: number;
  y: number;
  icon: string;
  rotation?: number; // Add rotation support
  drawingMode?: boolean; // Add drawing mode tracking
}
interface TextShape {
  tool: "text";
  x: number;
  y: number;
  text: string;
  color: string;
  rotation?: number; // Add rotation support
  drawingMode?: boolean; // Add drawing mode tracking
}
interface DoorShape {
  tool: "door";
  x: number;
  y: number;
  orientation: "horizontal" | "vertical";
  width: number;
  height: number;
  rotation?: number; // Add rotation support
  drawingMode?: boolean; // Add drawing mode tracking
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

// ICONS array with old-school D&D dungeon features
const ICONS = [
  { name: "bones", icon: "🦴" },
  { name: "skull", icon: "💀" },
  { name: "trap_door", icon: "🕳️" },
  { name: "ladder", icon: "🪜" },
  { name: "altar", icon: "⛩️" },
  { name: "coffin", icon: "⚰️" },
  { name: "rubble", icon: "🧱" },
  { name: "chest", icon: "📦" },
  { name: "treasure", icon: "💰" },
  { name: "spiral_stairs", icon: "🌀" },
  { name: "trap", icon: "⚡" },
  { name: "statue", icon: "🗿" },
  { name: "pillar", icon: "⬜" },
  { name: "well", icon: "⭕" },
  { name: "fountain", icon: "⛲" },
  { name: "fire", icon: "🔥" },
  { name: "torch", icon: "🕯️" },
  { name: "crystal", icon: "💎" },
  { name: "mushroom", icon: "🍄" },
  { name: "web", icon: "🕸️" },
  { name: "key", icon: "🗝️" },
  { name: "scroll", icon: "📜" },
  { name: "book", icon: "📚" },
  { name: "potion", icon: "🧪" },
  { name: "shield", icon: "🛡️" },
  { name: "sword", icon: "⚔️" },
  { name: "bow", icon: "🏹" },
  { name: "hammer", icon: "🔨" },
  { name: "anvil", icon: "⚒️" },
  { name: "cauldron", icon: "�" },
  { name: "bed", icon: "🛏️" },
  { name: "table", icon: "�" },
  { name: "barrel", icon: "🛢️" },
  { name: "crate", icon: "📦" },
  { name: "lever", icon: "🕹️" },
  { name: "gear", icon: "⚙️" },
  { name: "chain", icon: "⛓️" },
  { name: "rope", icon: "🪢" },
  { name: "bell", icon: "🔔" },
  { name: "horn", icon: "�" },
];

function DungeonEditor() {
  const { projectId } = useParams<{ projectId?: string }>();
  const [tool, setTool] = React.useState<ToolName>("line");
  const [drawing, setDrawing] = React.useState<Shape | null>(null);
  const [shapes, setShapes] = React.useState<Shape[]>([]);
  const [history, setHistory] = React.useState<Shape[][]>([]);
  const [future, setFuture] = React.useState<Shape[][]>([]);
  const [backgroundColor, setBackgroundColor] =
    React.useState<string>("#f5ecd6");
  const [underlayerColor, setUnderlayerColor] = React.useState<string>("#222");
  const [colorPickerMode, setColorPickerMode] = React.useState<
    "background" | "underlayer"
  >("background");
  const [iconIndex, setIconIndex] = React.useState(0);

  // Shape color matches the stone/grid color (underlayerColor)
  const shapeColor = underlayerColor;
  const [showColorPicker, setShowColorPicker] = React.useState(false);
  const [showGrid, setShowGrid] = React.useState(true);
  const [snapTo, setSnapTo] = React.useState(true);
  const [addMode, setAddMode] = React.useState(false); // false = carve mode, true = add mode
  const [thickness, setThickness] = React.useState(4);
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);
  const [dragOffset, setDragOffset] = React.useState<{
    dx: number;
    dy: number;
  } | null>(null);
  const [isRotating, setIsRotating] = React.useState(false);
  const [rotationStart, setRotationStart] = React.useState<{
    angle: number;
    shapeRotation: number;
  } | null>(null);
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizeStart, setResizeStart] = React.useState<{
    handleType: string;
    originalShape: Shape;
    startX: number;
    startY: number;
  } | null>(null);
  const stageRef = React.useRef<any>(null);
  const navigate = useNavigate();
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [saveFilename, setSaveFilename] = React.useState("dungeon-map.jpg");
  const [gridSize, setGridSize] = React.useState<number>(GRID_SIZE);
  const [canvasWidth, setCanvasWidth] = React.useState<number>(1024);
  const [canvasHeight, setCanvasHeight] = React.useState<number>(768);
  // --- Zoom and Pan ---
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const isPanning = React.useRef(false);
  const lastPan = React.useRef({ x: 0, y: 0 });

  // New state for project management
  const [currentProjectId, setCurrentProjectId] = React.useState<string | null>(
    projectId || null
  );
  const [currentProjectName, setCurrentProjectName] =
    React.useState<string>("Untitled Dungeon");
  const [showSaveProjectModal, setShowSaveProjectModal] = React.useState(false);
  const [showLoadProjectModal, setShowLoadProjectModal] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [savedProjects, setSavedProjects] = React.useState<DungeonProject[]>(
    []
  );
  const [projectName, setProjectName] = React.useState(currentProjectName);
  const [projectDescription, setProjectDescription] =
    React.useState<string>("");
  const [exportName, setExportName] = React.useState<string>("");
  const [exportDescription, setExportDescription] = React.useState<string>("");
  const [showSettingsPanel, setShowSettingsPanel] = React.useState(false);
  const [copiedShape, setCopiedShape] = React.useState<Shape | null>(null);

  function maybeSnap(val: number, forDoor = false) {
    if (!snapTo) return val;
    if (forDoor) {
      // Snap to the center of the grid line
      return Math.floor(val / gridSize) * gridSize + gridSize / 2;
    }
    return Math.round(val / gridSize) * gridSize;
  }

  function getDoorSnap(
    pointer: { x: number; y: number },
    orientation: "horizontal" | "vertical"
  ) {
    if (orientation === "horizontal") {
      // For horizontal doors, snap to center of grid cell horizontally, and to grid line (middle) vertically
      return {
        x: Math.floor(pointer.x / gridSize) * gridSize + gridSize / 2,
        y: Math.round(pointer.y / gridSize) * gridSize,
      };
    } else {
      // For vertical doors, snap to grid line (middle) horizontally, and center of grid cell vertically
      return {
        x: Math.round(pointer.x / gridSize) * gridSize,
        y: Math.floor(pointer.y / gridSize) * gridSize + gridSize / 2,
      };
    }
  }

  // Utility to get logical (untransformed) pointer position
  function getLogicalPointerPosition(stage: any) {
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    return {
      x: (pointer.x - pan.x) / zoom,
      y: (pointer.y - pan.y) / zoom,
    };
  }

  // Helper function to get the composite operation based on mode
  function getCompositeOperation() {
    return addMode ? "source-over" : "destination-out";
  }

  // Helper function to get fill/stroke color based on mode
  function getFillColor(shape: any) {
    return addMode ? shape.color : "#fff";
  }

  function getStrokeColor(shape: any) {
    return addMode ? shape.color : "#fff";
  }

  // Load project on mount if projectId is provided
  React.useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
    loadSavedProjects();
  }, [projectId]);

  // Sync projectName with currentProjectName when it changes
  React.useEffect(() => {
    setProjectName(currentProjectName);
  }, [currentProjectName]);

  // Load saved projects list
  const loadSavedProjects = async () => {
    try {
      const projects = await getAllDungeonProjects();
      setSavedProjects(projects);
    } catch (error) {
      console.error("Error loading saved projects:", error);
      setSavedProjects([]); // Set empty array on error
    }
  };

  // Load a specific project
  const loadProject = async (id: string) => {
    try {
      const project = await getDungeonProject(id);
      if (project) {
        setCurrentProjectId(project.id);
        setCurrentProjectName(project.name);
        setProjectName(project.name);
        setProjectDescription(project.description || "");
        setShapes(project.shapes || []);
        setCanvasWidth(project.canvasWidth || 1024);
        setCanvasHeight(project.canvasHeight || 768);
        setGridSize(project.gridSize || GRID_SIZE);
        setBackgroundColor(project.backgroundColor || "#f5ecd6");
        setUnderlayerColor(project.underlayerColor || "#222");
        setHistory([]); // Reset history when loading
        setFuture([]);

        // Update the URL to reflect the loaded project
        navigate(`/dungeon/${project.id}`, { replace: true });
      }
    } catch (error) {
      console.error("Error loading project:", error);
      alert("Failed to load project. Please try again.");
    }
  };

  // Save current project
  const saveCurrentProject = async () => {
    try {
      const id =
        currentProjectId ||
        `dungeon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Generate thumbnail
      let thumbnail: Blob | undefined;
      if (stageRef.current) {
        const stage = stageRef.current;
        const bgLayer = new Konva.Layer();
        const bgRect = new Konva.Rect({
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          fill: backgroundColor,
          listening: false,
        });
        bgLayer.add(bgRect);
        stage.add(bgLayer);
        bgLayer.moveToBottom();
        stage.draw();

        const canvas = stage.toCanvas({ pixelRatio: 0.2 }); // Small thumbnail
        thumbnail = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/jpeg", 0.8)
        );

        bgLayer.destroy();
        stage.draw();
      }

      const project: DungeonProject = {
        id,
        name: projectName,
        description: projectDescription,
        shapes: shapes,
        canvasWidth,
        canvasHeight,
        gridSize,
        backgroundColor,
        underlayerColor,
        lastModified: new Date(),
        thumbnail,
      };

      await saveDungeonProject(project);
      setCurrentProjectId(id);
      setCurrentProjectName(projectName);
      setShowSaveProjectModal(false);
      await loadSavedProjects(); // Refresh the list

      // Update URL to include project ID if it's a new project
      if (!currentProjectId) {
        navigate(`/dungeon/${id}`, { replace: true });
      }

      alert(`Project "${projectName}" saved successfully!`);
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save project. Please try again.");
    }
  };

  // Export to Map Gallery
  const exportToGallery = async () => {
    try {
      if (stageRef.current) {
        const stage = stageRef.current;
        const bgLayer = new Konva.Layer();
        const bgRect = new Konva.Rect({
          x: 0,
          y: 0,
          width: canvasWidth,
          height: canvasHeight,
          fill: backgroundColor,
          listening: false,
        });
        bgLayer.add(bgRect);
        stage.add(bgLayer);
        bgLayer.moveToBottom();
        stage.draw();

        const blob = await new Promise<Blob>((resolve) =>
          stage.toCanvas().toBlob(resolve, "image/jpeg", 0.95)
        );

        bgLayer.destroy();
        stage.draw();

        if (blob) {
          await exportDungeonToGallery(
            currentProjectId || "temp",
            blob,
            exportName,
            exportDescription
          );
          setShowExportModal(false);

          // Clear export form
          setExportName("");
          setExportDescription("");

          alert(`Map "${exportName}" exported successfully to the gallery!`);

          // Optionally navigate to gallery
          if (confirm("Would you like to view the map in the gallery now?")) {
            navigate("/gallery");
          }
        }
      }
    } catch (error) {
      console.error("Error exporting to gallery:", error);
      alert("Failed to export to gallery. Please try again.");
    }
  };

  // Mouse events for drawing and selection
  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pointer = getLogicalPointerPosition(stage);
    if (!pointer) return;
    const x = maybeSnap(pointer.x);
    const y = maybeSnap(pointer.y);

    if (tool === "select") {
      // Check if clicking on rotation handle first - use raw coordinates for better precision
      if (
        selectedIndex !== null &&
        selectedIndex >= 0 &&
        selectedIndex < shapes.length
      ) {
        const shape = shapes[selectedIndex];
        if (!shape) return; // Guard against undefined shape

        // Check for resize handle first
        const resizeHandle = getResizeHandleAtPoint(
          shape,
          pointer.x,
          pointer.y,
          10
        );
        if (resizeHandle) {
          setIsResizing(true);
          setResizeStart({
            handleType: resizeHandle.type,
            originalShape: { ...shape },
            startX: pointer.x,
            startY: pointer.y,
          });
          return;
        }

        // Then check for rotation handle
        const handlePos = getRotationHandlePosition(shape);
        const distance = Math.sqrt(
          Math.pow(pointer.x - handlePos.x, 2) +
            Math.pow(pointer.y - handlePos.y, 2)
        );
        if (distance <= 15) {
          // Even larger hit area for better usability
          // Starting rotation
          const center = getShapeCenter(shape);
          const startAngle = calculateAngle(center, {
            x: pointer.x,
            y: pointer.y,
          });
          setIsRotating(true);
          setRotationStart({
            angle: startAngle,
            shapeRotation: shape.rotation || 0,
          });
          return;
        }
      }

      // Find topmost shape under cursor
      for (let i = shapes.length - 1; i >= 0; i--) {
        const shape = shapes[i];
        let hit = false;
        if (shape.tool === "icon") {
          const iconSize = (shape as any).size || 32;
          const halfSize = iconSize / 2;
          if (
            x >= shape.x - halfSize &&
            x <= shape.x + halfSize &&
            y >= shape.y - halfSize &&
            y <= shape.y + halfSize
          )
            hit = true;
        } else if (shape.tool === "line") {
          const [p1, p2] = shape.points;
          const dist = pointToSegmentDist(x, y, p1.x, p1.y, p2.x, p2.y);
          if (dist <= (shape.thickness || thickness) + 6) hit = true;
        } else if (shape.tool === "free") {
          // Better hit detection for free-form shapes
          const center = getShapeCenter(shape);
          const checkRadius = 20; // Reasonable hit area around centroid
          const dx = x - center.x;
          const dy = y - center.y;
          if (Math.sqrt(dx * dx + dy * dy) <= checkRadius) {
            hit = true;
          } else {
            // Also check individual line segments
            for (let j = 0; j < shape.points.length - 1; j++) {
              const p1 = shape.points[j];
              const p2 = shape.points[j + 1];
              const dist = pointToSegmentDist(x, y, p1.x, p1.y, p2.x, p2.y);
              if (dist <= (shape.thickness || thickness) + 6) {
                hit = true;
                break;
              }
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
          const doorW =
            shape.orientation === "horizontal"
              ? Math.abs(shape.width)
              : Math.abs(shape.height);
          const doorH =
            shape.orientation === "horizontal"
              ? Math.abs(shape.height)
              : Math.abs(shape.width);

          // Ensure minimum hit area
          const actualDoorW = Math.max(8, doorW);
          const actualDoorH = Math.max(4, doorH);

          const doorX = shape.x - actualDoorW / 2;
          const doorY = shape.y - actualDoorH / 2;

          if (
            x >= doorX &&
            x <= doorX + actualDoorW &&
            y >= doorY &&
            y <= doorY + actualDoorH
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
          const iconSize = (shape as any).size || 32;
          const halfSize = iconSize / 2;
          if (
            x >= shape.x - halfSize &&
            x <= shape.x + halfSize &&
            y >= shape.y - halfSize &&
            y <= shape.y + halfSize
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
        } else if (shape.tool === "door") {
          // Door deletion: check if pointer is inside door rect
          const actualDoorW = Math.max(8, Math.abs(shape.width));
          const actualDoorH = Math.max(4, Math.abs(shape.height));

          const doorX = shape.x - actualDoorW / 2;
          const doorY = shape.y - actualDoorH / 2;

          if (
            x >= doorX &&
            x <= doorX + actualDoorW &&
            y >= doorY &&
            y <= doorY + actualDoorH
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
        {
          tool: "icon",
          x,
          y,
          icon: ICONS[iconIndex].icon,
          drawingMode: addMode,
        } as IconShape,
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
        color: shapeColor,
        thickness,
      });
    } else if (tool === "rect") {
      setDrawing({
        tool: "rect",
        x,
        y,
        width: 0,
        height: 0,
        color: shapeColor,
        thickness,
      });
    } else if (tool === "roundedRect") {
      // Start drawing from anchor point, width/height 0
      setDrawing({
        tool: "roundedRect",
        x,
        y,
        width: 0,
        height: 0,
        radius: 0,
        color: shapeColor,
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
        color: shapeColor,
        thickness,
      });
    } else if (tool === "circle") {
      setDrawing({
        tool: "circle",
        x,
        y,
        radius: 0,
        color: shapeColor,
        thickness,
      });
    } else if (["pentagon", "hexagon", "octagon"].includes(tool)) {
      setDrawing({
        tool: tool as "pentagon" | "hexagon" | "octagon",
        x,
        y,
        radius: 0,
        sides: tool === "pentagon" ? 5 : tool === "hexagon" ? 6 : 8,
        color: shapeColor,
        thickness,
      });
    } else if (tool === "free") {
      setDrawing({
        tool: "free",
        points: [{ x, y }],
        color: shapeColor,
        thickness,
      });
    } else if (tool === "door") {
      // Place a door at snapped x/y, default orientation horizontal, size 32x8
      let doorX: number, doorY: number, orientation: "horizontal" | "vertical";
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
        width: 32, // Consistent door size
        height: 8,
      });
      return;
    }
  };

  const handleMouseMove = (e: any) => {
    if (
      isResizing &&
      selectedIndex !== null &&
      selectedIndex >= 0 &&
      selectedIndex < shapes.length &&
      resizeStart
    ) {
      const stage = e.target.getStage();
      const pointer = getLogicalPointerPosition(stage);
      if (!pointer) return;

      const deltaX = pointer.x - resizeStart.startX;
      const deltaY = pointer.y - resizeStart.startY;
      const originalShape = resizeStart.originalShape;

      setShapes((shapes) =>
        shapes.map((s, idx) => {
          if (idx !== selectedIndex) return s;

          // Apply resize based on handle type
          return applyResize(
            originalShape,
            resizeStart.handleType,
            deltaX,
            deltaY,
            snapTo
          );
        })
      );
      return;
    }

    if (
      isRotating &&
      selectedIndex !== null &&
      selectedIndex >= 0 &&
      selectedIndex < shapes.length &&
      rotationStart
    ) {
      const stage = e.target.getStage();
      const pointer = getLogicalPointerPosition(stage);
      if (!pointer) return;

      const shape = shapes[selectedIndex];
      if (!shape) return; // Guard against undefined shape
      const center = getShapeCenter(shape);
      const currentAngle = calculateAngle(center, pointer);
      const deltaAngle = currentAngle - rotationStart.angle;
      let newRotation = rotationStart.shapeRotation + deltaAngle;

      // Apply rotation snapping when snap-to-grid is enabled
      newRotation = snapRotation(newRotation, snapTo);

      setShapes((shapes) =>
        shapes.map((s, idx) => {
          if (idx !== selectedIndex) return s;
          return { ...s, rotation: newRotation };
        })
      );
      return;
    }

    if (tool === "select" && selectedIndex !== null && dragOffset) {
      const stage = e.target.getStage();
      const pointer = getLogicalPointerPosition(stage);
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
              // Snap to grid: use getDoorSnap with current orientation
              const snapped = getDoorSnap(pointer, s.orientation);
              return {
                ...s,
                x: snapped.x,
                y: snapped.y,
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
    const pointer = getLogicalPointerPosition(stage);
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
      // Do NOT update drawing.x/y to normalized values; keep anchor point as start
      const width = x - drawing.x;
      const height = y - drawing.y;
      setDrawing({
        ...drawing,
        width,
        height,
        // radius will be normalized at render time
      });
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
      // Allow orientation change based on drag direction
      let orientation = drawing.orientation;
      const dx = Math.abs(pointer.x - drawing.x);
      const dy = Math.abs(pointer.y - drawing.y);

      // More sensitive orientation change - smaller threshold
      if (dx > 10 || dy > 10) {
        if (dx > dy * 1.2) {
          orientation = "horizontal";
        } else if (dy > dx * 1.2) {
          orientation = "vertical";
        }
      }

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
    if (isResizing) {
      setIsResizing(false);
      setResizeStart(null);
      return;
    }

    if (isRotating) {
      setIsRotating(false);
      setRotationStart(null);
      return;
    }

    if (tool === "select") {
      setDragOffset(null);
      return;
    }
    if (drawing) {
      if (drawing.tool === "door") {
        pushHistoryAndSetShapes([
          ...shapes,
          { ...drawing, drawingMode: addMode },
        ]);
        setDrawing(null);
        return;
      }
      // Add drawingMode property to remember what mode the shape was drawn in
      pushHistoryAndSetShapes([
        ...shapes,
        { ...drawing, drawingMode: addMode },
      ]);
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

  // Copy and paste functions
  const handleCopy = () => {
    if (
      selectedIndex !== null &&
      selectedIndex >= 0 &&
      selectedIndex < shapes.length
    ) {
      const shapeToCopy = shapes[selectedIndex];
      setCopiedShape(shapeToCopy);
    }
  };

  const handlePaste = () => {
    if (!copiedShape) return;

    // Create a copy of the shape with slight offset that snaps to grid
    const offset = 32; // Use grid size as offset for better alignment
    let newShape: Shape;

    if (copiedShape.tool === "line") {
      const lineShape = copiedShape as Line;
      newShape = {
        ...lineShape,
        points: [
          {
            x: maybeSnap(lineShape.points[0].x + offset),
            y: maybeSnap(lineShape.points[0].y + offset),
          },
          {
            x: maybeSnap(lineShape.points[1].x + offset),
            y: maybeSnap(lineShape.points[1].y + offset),
          },
        ] as [Point, Point],
      };
    } else if (copiedShape.tool === "triangle") {
      const triangleShape = copiedShape as Triangle;
      newShape = {
        ...triangleShape,
        points: [
          {
            x: maybeSnap(triangleShape.points[0].x + offset),
            y: maybeSnap(triangleShape.points[0].y + offset),
          },
          {
            x: maybeSnap(triangleShape.points[1].x + offset),
            y: maybeSnap(triangleShape.points[1].y + offset),
          },
          {
            x: maybeSnap(triangleShape.points[2].x + offset),
            y: maybeSnap(triangleShape.points[2].y + offset),
          },
        ] as [Point, Point, Point],
      };
    } else if (copiedShape.tool === "free") {
      const freeShape = copiedShape as Free;
      newShape = {
        ...freeShape,
        points: freeShape.points.map((p) => ({
          x: maybeSnap(p.x + offset),
          y: maybeSnap(p.y + offset),
        })),
      };
    } else if (copiedShape.tool === "door") {
      // For doors, use special door snapping
      const doorShape = copiedShape as DoorShape;
      const snappedPos = getDoorSnap(
        { x: doorShape.x + offset, y: doorShape.y + offset },
        doorShape.orientation
      );
      newShape = {
        ...doorShape,
        x: snappedPos.x,
        y: snappedPos.y,
      };
    } else {
      // For shapes with x,y properties (most shapes)
      newShape = {
        ...copiedShape,
        x: maybeSnap((copiedShape as any).x + offset),
        y: maybeSnap((copiedShape as any).y + offset),
      };
    }

    // Add the new shape and select it
    const newShapes = [...shapes, newShape];
    pushHistoryAndSetShapes(newShapes);
    setSelectedIndex(newShapes.length - 1);
    setTool("select"); // Switch to select tool to show the new shape is selected
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
      tool === "door" ||
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
      // Dynamic cursor for select tool based on what's under the mouse
      cursor = "pointer";

      // Add hover detection for resize handles when in select mode
      const canvas = document.querySelector(".dungeon-canvas") as HTMLElement;
      if (canvas) {
        const handleMouseMove = (e: MouseEvent) => {
          if (
            selectedIndex !== null &&
            selectedIndex >= 0 &&
            selectedIndex < shapes.length
          ) {
            const shape = shapes[selectedIndex];
            if (shape) {
              const rect = canvas.getBoundingClientRect();
              const x = (e.clientX - rect.left - pan.x) / zoom;
              const y = (e.clientY - rect.top - pan.y) / zoom;

              const resizeHandle = getResizeHandleAtPoint(shape, x, y, 10);
              if (resizeHandle) {
                canvas.style.cursor = resizeHandle.cursor;
                return;
              }

              const handlePos = getRotationHandlePosition(shape);
              const distance = Math.sqrt(
                Math.pow(x - handlePos.x, 2) + Math.pow(y - handlePos.y, 2)
              );
              if (distance <= 15) {
                canvas.style.cursor = "grab";
                return;
              }
            }
          }
          canvas.style.cursor = "pointer";
        };

        canvas.addEventListener("mousemove", handleMouseMove);
        return () => canvas.removeEventListener("mousemove", handleMouseMove);
      }
    }
    const canvas = document.querySelector(".dungeon-canvas") as HTMLElement;
    if (canvas) canvas.style.cursor = cursor;
  }, [tool, selectedIndex, shapes, pan, zoom]);

  // Mouse wheel zoom (centered on mouse)
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const scaleBy = 1.1;
    let newZoom = oldScale;
    if (e.evt.deltaY < 0) {
      newZoom = Math.min(4, oldScale * scaleBy);
    } else {
      newZoom = Math.max(0.25, oldScale / scaleBy);
    }
    // Calculate new pan so zoom centers on pointer
    const mousePointTo = {
      x: (pointer.x - pan.x) / oldScale,
      y: (pointer.y - pan.y) / oldScale,
    };
    const newPan = {
      x: pointer.x - mousePointTo.x * newZoom,
      y: pointer.y - mousePointTo.y * newZoom,
    };
    setZoom(newZoom);
    setPan(newPan);
  };

  // Mouse drag panning
  const handleStageMouseDown = (e: any) => {
    if (
      e.evt.button === 1 ||
      (e.target === e.target.getStage() && tool === "select" && e.evt.ctrlKey)
    ) {
      isPanning.current = true;
      lastPan.current = { x: e.evt.clientX, y: e.evt.clientY };
      document.body.style.cursor = "grab";
    } else {
      handleMouseDown(e);
    }
  };
  const handleStageMouseMove = (e: any) => {
    if (isPanning.current) {
      const dx = e.evt.clientX - lastPan.current.x;
      const dy = e.evt.clientY - lastPan.current.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPan.current = { x: e.evt.clientX, y: e.evt.clientY };
    } else {
      handleMouseMove(e);
    }
  };
  const handleStageMouseUp = () => {
    if (isPanning.current) {
      isPanning.current = false;
      document.body.style.cursor = "";
    } else {
      handleMouseUp(); // fix: call with no arguments
    }
  };
  React.useEffect(() => {
    const up = () => {
      if (isPanning.current) {
        isPanning.current = false;
        document.body.style.cursor = "";
      }
    };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

  // Keyboard event listener for delete key, copy, and paste
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior when focused on input elements
      if (
        e.target &&
        ((e.target as HTMLElement).tagName === "INPUT" ||
          (e.target as HTMLElement).tagName === "TEXTAREA")
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (
          selectedIndex !== null &&
          selectedIndex >= 0 &&
          selectedIndex < shapes.length
        ) {
          // Delete the selected shape
          pushHistoryAndSetShapes(
            shapes.filter((_, idx) => idx !== selectedIndex)
          );
          setSelectedIndex(null);
          setDragOffset(null);
          e.preventDefault(); // Prevent default browser behavior
        }
      }

      // Undo (Ctrl+Z)
      if (e.ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }

      // Redo (Ctrl+Y or Ctrl+Shift+Z)
      if (e.ctrlKey && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }

      // Copy (Ctrl+C)
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        handleCopy();
      }

      // Paste (Ctrl+V)
      if (e.ctrlKey && e.key === "v") {
        e.preventDefault();
        handlePaste();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, shapes, copiedShape]);

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
            <h2 style={{ marginTop: 0, fontSize: 20, color: "#333" }}>
              Save as JPEG
            </h2>
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
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 15,
                color: "#333",
              }}
            >
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
                  color: "#333",
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
                    const bgLayer = new Konva.Layer();
                    const bgRect = new Konva.Rect({
                      x: 0,
                      y: 0,
                      width: CANVAS_WIDTH,
                      height: CANVAS_HEIGHT,
                      fill: backgroundColor,
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

      {/* Save Project Modal */}
      {showSaveProjectModal && (
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
          onClick={() => setShowSaveProjectModal(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 400,
              maxWidth: 500,
              boxShadow: "0 4px 24px #0003",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, fontSize: 20, color: "#333" }}>
              Save Dungeon Project
            </h2>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                Project Name:
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    fontSize: 14,
                    boxSizing: "border-box",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    color: "#333",
                  }}
                  placeholder="Enter project name..."
                />
              </label>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                Description (optional):
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    fontSize: 14,
                    boxSizing: "border-box",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    minHeight: 60,
                    resize: "vertical",
                    color: "#333",
                  }}
                  placeholder="Enter project description..."
                />
              </label>
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <button
                onClick={() => {
                  setShowSaveProjectModal(false);
                  setProjectName(currentProjectName); // Reset project name to current name on cancel
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  background: "#fff",
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={saveCurrentProject}
                disabled={!projectName.trim()}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "none",
                  background: projectName.trim() ? "#4CAF50" : "#ccc",
                  color: "#fff",
                  cursor: projectName.trim() ? "pointer" : "not-allowed",
                  fontWeight: 600,
                }}
              >
                Save Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Project Modal */}
      {showLoadProjectModal && (
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
          onClick={() => setShowLoadProjectModal(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 500,
              maxWidth: 700,
              maxHeight: "80vh",
              boxShadow: "0 4px 24px #0003",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: 20,
                marginBottom: 16,
                color: "#333",
              }}
            >
              Load Dungeon Project
            </h2>
            {savedProjects.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#666" }}>
                <p style={{ color: "#666" }}>No saved projects found.</p>
                <p style={{ color: "#666" }}>
                  Create and save a project first!
                </p>
              </div>
            ) : (
              <div style={{ overflowY: "auto", flex: 1 }}>
                {savedProjects.map((project) => (
                  <div
                    key={project.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: 12,
                      border: "1px solid #eee",
                      borderRadius: 8,
                      marginBottom: 12,
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#f5f5f5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                    onClick={() => {
                      loadProject(project.id);
                      setShowLoadProjectModal(false);
                    }}
                  >
                    {project.thumbnail && (
                      <img
                        src={URL.createObjectURL(project.thumbnail)}
                        alt={project.name}
                        style={{
                          width: 60,
                          height: 45,
                          objectFit: "cover",
                          borderRadius: 4,
                          marginRight: 12,
                          border: "1px solid #ddd",
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#333",
                        }}
                      >
                        {project.name}
                      </h3>
                      {project.description && (
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: 14,
                            color: "#666",
                          }}
                        >
                          {project.description}
                        </p>
                      )}
                      <p
                        style={{
                          margin: "4px 0 0 0",
                          fontSize: 12,
                          color: "#999",
                        }}
                      >
                        Last modified:{" "}
                        {project.lastModified.toLocaleDateString()} at{" "}
                        {project.lastModified.toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (
                          confirm(
                            `Are you sure you want to delete "${project.name}"?`
                          )
                        ) {
                          try {
                            await deleteDungeonProject(project.id);
                            await loadSavedProjects();
                          } catch (error) {
                            console.error("Error deleting project:", error);
                            alert(
                              "Failed to delete project. Please try again."
                            );
                          }
                        }
                      }}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 4,
                        border: "1px solid #f44336",
                        background: "#fff",
                        color: "#f44336",
                        cursor: "pointer",
                        fontSize: 12,
                      }}
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setShowLoadProjectModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  background: "#fff",
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
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
          onClick={() => setShowColorPicker(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              boxShadow: "0 4px 24px #0003",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, color: "#333" }}>
              {colorPickerMode === "background"
                ? "Canvas Background Color"
                : "Stone & Grid Color"}
            </h3>

            <SketchPicker
              color={
                colorPickerMode === "background"
                  ? backgroundColor
                  : underlayerColor
              }
              onChange={(newColor) => {
                if (colorPickerMode === "background") {
                  setBackgroundColor(newColor.hex);
                } else {
                  setUnderlayerColor(newColor.hex);
                }
              }}
              disableAlpha={true}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setColorPickerMode("background")}
                style={{
                  padding: "8px 16px",
                  background:
                    colorPickerMode === "background" ? "#4CAF50" : "#666",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Canvas
              </button>
              <button
                onClick={() => setColorPickerMode("underlayer")}
                style={{
                  padding: "8px 16px",
                  background:
                    colorPickerMode === "underlayer" ? "#4CAF50" : "#666",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                Stone
              </button>
            </div>

            <button
              onClick={() => setShowColorPicker(false)}
              style={{
                padding: "8px 24px",
                background: "#333",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Export to Gallery Modal */}
      {showExportModal && (
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
          onClick={() => setShowExportModal(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 8,
              minWidth: 400,
              maxWidth: 500,
              boxShadow: "0 4px 24px #0003",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, fontSize: 20, color: "#333" }}>
              Export to Map Gallery
            </h2>
            <p style={{ color: "#666", marginBottom: 16 }}>
              Export your completed dungeon to the Map Gallery where it can be
              viewed and used for gameplay.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                Map Name:
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    fontSize: 14,
                    boxSizing: "border-box",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    color: "#333",
                  }}
                  placeholder="Enter map name..."
                />
              </label>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                Description (optional):
                <textarea
                  value={exportDescription}
                  onChange={(e) => setExportDescription(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 4,
                    padding: 8,
                    fontSize: 14,
                    boxSizing: "border-box",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    minHeight: 60,
                    resize: "vertical",
                    color: "#333",
                  }}
                  placeholder="Describe your map for other users..."
                />
              </label>
            </div>
            <div
              style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}
            >
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setExportName(""); // Reset export name on cancel
                  setExportDescription("");
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  background: "#fff",
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={exportToGallery}
                disabled={!exportName.trim()}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: "none",
                  background: exportName.trim() ? "#FF9800" : "#ccc",
                  color: "#fff",
                  cursor: exportName.trim() ? "pointer" : "not-allowed",
                  fontWeight: 600,
                }}
              >
                Export to Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dungeon-upperbar">
        {/* Left section - Navigation & Project */}
        <div className="toolbar-section toolbar-left">
          <button
            className="back-home-btn"
            onClick={() => navigate("/")}
            title="Back to Home"
          >
            ⟵ Home
          </button>

          <div className="project-info">
            <span className="project-label">Project:</span>
            <span className="project-name">{currentProjectName}</span>
          </div>
        </div>

        {/* Center section - Main actions and settings */}
        <div className="toolbar-section toolbar-center">
          {/* File Operations Group */}
          <div className="button-group">
            <button
              onClick={() => {
                if (
                  shapes.length > 0 &&
                  confirm(
                    "Starting a new project will clear your current work. Continue?"
                  )
                ) {
                  setShapes([]);
                  setHistory([]);
                  setFuture([]);
                  setCurrentProjectId(null);
                  setCurrentProjectName("Untitled Dungeon");
                  setProjectName("Untitled Dungeon");
                  setProjectDescription("");
                  navigate("/dungeon", { replace: true });
                } else if (shapes.length === 0) {
                  setCurrentProjectId(null);
                  setCurrentProjectName("Untitled Dungeon");
                  setProjectName("Untitled Dungeon");
                  setProjectDescription("");
                  navigate("/dungeon", { replace: true });
                }
              }}
              className="btn-secondary"
              title="Start a new project"
            >
              📄 New
            </button>

            <button
              onClick={() => {
                setProjectName(currentProjectName);
                setShowSaveProjectModal(true);
              }}
              className="btn-success"
              title="Save Project"
            >
              💾 Save
            </button>

            <button
              onClick={() => setShowLoadProjectModal(true)}
              className="btn-primary"
              title="Load Project"
            >
              📂 Load
            </button>
          </div>

          {/* Edit Operations Group */}
          <div className="button-group">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className={
                history.length === 0 ? "btn-disabled" : "btn-secondary"
              }
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>

            <button
              onClick={handleRedo}
              disabled={future.length === 0}
              className={future.length === 0 ? "btn-disabled" : "btn-secondary"}
              title="Redo (Ctrl+Y)"
            >
              ↷
            </button>

            <button
              onClick={handleCopy}
              disabled={selectedIndex === null}
              className={
                selectedIndex === null ? "btn-disabled" : "btn-secondary"
              }
              title="Copy (Ctrl+C)"
            >
              📋
            </button>

            <button
              onClick={handlePaste}
              disabled={!copiedShape}
              className={!copiedShape ? "btn-disabled" : "btn-secondary"}
              title="Paste (Ctrl+V)"
            >
              📄
            </button>

            <button
              onClick={handleClearAll}
              className="btn-danger"
              title="Clear all shapes"
            >
              🗑️
            </button>
          </div>

          {/* Drawing Mode Toggle */}
          <div className="button-group">
            <button
              onClick={() => setAddMode((v) => !v)}
              className={addMode ? "btn-active" : "btn-inactive"}
              title={
                addMode ? "Switch to Carving Mode" : "Switch to Adding Mode"
              }
            >
              {addMode ? "✏️ Adding" : "⛏️ Carving"}
            </button>
          </div>

          {/* View Controls Group */}
          <div className="button-group">
            <button
              onClick={() => setShowGrid((v) => !v)}
              className={showGrid ? "btn-active" : "btn-inactive"}
              title="Toggle Grid"
            >
              {showGrid ? "⬜" : "⬛"}
            </button>

            <button
              onClick={() => setSnapTo((v) => !v)}
              className={snapTo ? "btn-active" : "btn-inactive"}
              title="Toggle Snap to Grid"
            >
              {snapTo ? "🧲" : "🎯"}
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="zoom-controls">
            <button
              onClick={() => {
                const stage = stageRef.current;
                if (!stage) return;
                const center = { x: canvasWidth / 2, y: canvasHeight / 2 };
                const oldScale = zoom;
                const scaleBy = 1.1;
                let newZoom = Math.max(0.25, Math.min(4, zoom - 0.1));
                if (zoom > newZoom) newZoom = Math.max(0.25, zoom / scaleBy);
                else newZoom = Math.max(0.25, zoom - 0.1);
                const mousePointTo = {
                  x: (center.x - pan.x) / oldScale,
                  y: (center.y - pan.y) / oldScale,
                };
                const newPan = {
                  x: center.x - mousePointTo.x * newZoom,
                  y: center.y - mousePointTo.y * newZoom,
                };
                setZoom(newZoom);
                setPan(newPan);
              }}
              className="zoom-btn"
              title="Zoom Out"
            >
              -
            </button>
            <span className="zoom-display">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => {
                const stage = stageRef.current;
                if (!stage) return;
                const center = { x: canvasWidth / 2, y: canvasHeight / 2 };
                const oldScale = zoom;
                const scaleBy = 1.1;
                let newZoom = Math.min(4, Math.max(0.25, zoom + 0.1));
                if (zoom < newZoom) newZoom = Math.min(4, zoom * scaleBy);
                else newZoom = Math.min(4, zoom + 0.1);
                const mousePointTo = {
                  x: (center.x - pan.x) / oldScale,
                  y: (center.y - pan.y) / oldScale,
                };
                const newPan = {
                  x: center.x - mousePointTo.x * newZoom,
                  y: center.y - mousePointTo.y * newZoom,
                };
                setZoom(newZoom);
                setPan(newPan);
              }}
              className="zoom-btn"
              title="Zoom In"
            >
              +
            </button>
          </div>
        </div>

        {/* Right section - Export actions and overflow menu */}
        <div className="toolbar-section toolbar-right">
          <div className="button-group">
            <button
              onClick={() => {
                setExportName(currentProjectName);
                setShowExportModal(true);
              }}
              className="btn-warning"
              title="Export to Gallery"
            >
              🖼️ Gallery
            </button>

            <button
              onClick={() => setShowSaveModal(true)}
              className="btn-purple"
              title="Export as JPEG"
            >
              📸 Image
            </button>
          </div>

          {/* Settings Dropdown */}
          <div className="settings-dropdown">
            <button
              onClick={() => setShowSettingsPanel((v) => !v)}
              className="btn-secondary settings-toggle"
              title="Settings & Tools"
            >
              ⚙️
            </button>

            {showSettingsPanel && (
              <div className="settings-panel">
                <div className="settings-group">
                  <label htmlFor="grid-size-slider">
                    Grid Size: {gridSize}
                  </label>
                  <input
                    id="grid-size-slider"
                    type="range"
                    min={8}
                    max={128}
                    step={8}
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                  />
                </div>

                <div className="settings-group">
                  <label htmlFor="thickness-slider">
                    Line Thickness: {thickness}
                  </label>
                  <input
                    id="thickness-slider"
                    type="range"
                    min={1}
                    max={24}
                    step={1}
                    value={thickness}
                    onChange={(e) => setThickness(Number(e.target.value))}
                  />
                </div>

                <div className="settings-group canvas-size">
                  <label>Canvas Size</label>
                  <div className="size-inputs">
                    <input
                      type="number"
                      min={256}
                      max={4096}
                      step={8}
                      value={canvasWidth}
                      onChange={(e) => setCanvasWidth(Number(e.target.value))}
                      placeholder="Width"
                    />
                    <span>×</span>
                    <input
                      type="number"
                      min={256}
                      max={4096}
                      step={8}
                      value={canvasHeight}
                      onChange={(e) => setCanvasHeight(Number(e.target.value))}
                      placeholder="Height"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="dungeon-editor-main" style={{ display: "flex" }}>
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
              background:
                colorPickerMode === "background"
                  ? backgroundColor
                  : underlayerColor,
              width: 36,
              height: 36,
              border: "2px solid #fff",
              borderRadius: 4,
              margin: 8,
              cursor: "pointer",
            }}
            title={
              colorPickerMode === "background"
                ? "Background Color"
                : "Underlayer Color"
            }
            onClick={() => setShowColorPicker((v) => !v)}
          >
            🎨
          </button>

          {/* Color mode toggle buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 4,
              margin: "0 8px 8px 8px",
            }}
          >
            <button
              onClick={() => setColorPickerMode("background")}
              style={{
                padding: "4px 8px",
                fontSize: 12,
                background: colorPickerMode === "background" ? "#444" : "#666",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
              title="Background Color Mode"
            >
              Canvas
            </button>
            <button
              onClick={() => setColorPickerMode("underlayer")}
              style={{
                padding: "4px 8px",
                fontSize: 12,
                background: colorPickerMode === "underlayer" ? "#444" : "#666",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
              title="Stone/Grid Color Mode"
            >
              Stone
            </button>
          </div>

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

          {/* Icon selector panel - shown when icon tool is selected */}
          {tool === "icon" && (
            <div style={{ margin: "8px 8px 16px 8px" }}>
              {/* Current selection indicator - outside scrollable area */}
              <div
                style={{
                  marginBottom: 8,
                  padding: "4px 8px",
                  background: "#222",
                  borderRadius: 4,
                  fontSize: 12,
                  color: "#ccc",
                  textAlign: "center",
                }}
              >
                Selected: {ICONS[iconIndex].name.replace(/_/g, " ")}
              </div>

              {/* Scrollable icon grid */}
              <div
                className="icon-panel"
                style={{
                  background: "#333",
                  borderRadius: 6,
                  padding: 8,
                  maxHeight: "300px",
                  overflowY: "auto",
                  overflowX: "hidden",
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: 4,
                    justifyContent: "center",
                  }}
                >
                  {ICONS.map((ic, idx) => (
                    <button
                      key={ic.name}
                      style={{
                        fontSize: 18,
                        background: iconIndex === idx ? "#666" : "#444",
                        color: "#fff",
                        border:
                          iconIndex === idx
                            ? "2px solid #888"
                            : "1px solid #555",
                        borderRadius: 4,
                        cursor: "pointer",
                        width: "100%",
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease",
                        minWidth: 0,
                      }}
                      onClick={() => setIconIndex(idx)}
                      title={ic.name.replace(/_/g, " ")}
                      onMouseEnter={(e) => {
                        if (iconIndex !== idx) {
                          e.currentTarget.style.background = "#555";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (iconIndex !== idx) {
                          e.currentTarget.style.background = "#444";
                        }
                      }}
                    >
                      {ic.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="canvas-container">
          <Stage
            ref={stageRef}
            width={canvasWidth}
            height={canvasHeight}
            scaleX={zoom}
            scaleY={zoom}
            x={pan.x}
            y={pan.y}
            className="dungeon-canvas"
            style={{ background: backgroundColor, border: "1px solid #ccc" }}
            onWheel={handleWheel}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
          >
            {/* Underground + Mask Layer: always show background, existing shapes always carve */}
            <Layer id="underground-mask-layer">
              <KonvaRect
                x={0}
                y={0}
                width={canvasWidth}
                height={canvasHeight}
                fill={underlayerColor}
                listening={false}
              />
              {shapes.map((shape, i) => {
                // Only carve-out shapes (not icons/text) - use their original drawing mode
                if (shape.tool === "icon" || shape.tool === "text") return null;

                // Determine composite operation based on shape's original drawing mode
                const shapeOperation = (shape as any).drawingMode
                  ? "source-over"
                  : "destination-out";
                const shapeColor = (shape as any).drawingMode
                  ? (shape as any).color
                  : "#fff";

                if (shape.tool === "line") {
                  const center = getShapeCenter(shape);
                  return (
                    <KonvaLine
                      key={i}
                      points={[
                        shape.points[0].x - center.x,
                        shape.points[0].y - center.y,
                        shape.points[1].x - center.x,
                        shape.points[1].y - center.y,
                      ]}
                      stroke={shapeColor}
                      strokeWidth={shape.thickness || thickness}
                      lineCap="round"
                      lineJoin="round"
                      globalCompositeOperation={shapeOperation}
                      rotation={
                        shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                      }
                      x={center.x}
                      y={center.y}
                    />
                  );
                } else if (shape.tool === "rect") {
                  const center = getShapeCenter(shape);
                  return (
                    <KonvaRect
                      key={i}
                      x={center.x}
                      y={center.y}
                      width={shape.width}
                      height={shape.height}
                      fill={shapeColor}
                      globalCompositeOperation={shapeOperation}
                      rotation={
                        shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                      }
                      offsetX={center.x - shape.x}
                      offsetY={center.y - shape.y}
                    />
                  );
                } else if (shape.tool === "roundedRect") {
                  const norm = normalizeRectCoords(
                    shape.x,
                    shape.y,
                    shape.width,
                    shape.height
                  );
                  const center = getShapeCenter(shape);
                  return (
                    <KonvaRect
                      key={i}
                      x={center.x}
                      y={center.y}
                      width={norm.width}
                      height={norm.height}
                      cornerRadius={Math.min(
                        16,
                        norm.width / 2,
                        norm.height / 2
                      )}
                      fill={shapeColor}
                      globalCompositeOperation={shapeOperation}
                      rotation={
                        shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                      }
                      offsetX={center.x - norm.x}
                      offsetY={center.y - norm.y}
                    />
                  );
                } else if (shape.tool === "triangle") {
                  const center = getShapeCenter(shape);
                  return (
                    <KonvaLine
                      key={i}
                      points={shape.points.flatMap((p) => [
                        p.x - center.x,
                        p.y - center.y,
                      ])}
                      closed
                      fill={shapeColor}
                      globalCompositeOperation={shapeOperation}
                      rotation={
                        shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                      }
                      x={center.x}
                      y={center.y}
                    />
                  );
                } else if (shape.tool === "circle") {
                  return (
                    <KonvaCircle
                      key={i}
                      x={shape.x}
                      y={shape.y}
                      radius={shape.radius}
                      fill={shapeColor}
                      globalCompositeOperation={shapeOperation}
                      rotation={
                        shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                      }
                    />
                  );
                } else if (
                  ["pentagon", "hexagon", "octagon"].includes(shape.tool)
                ) {
                  const poly = shape as Polygon;
                  const angle = (2 * Math.PI) / poly.sides;
                  const points = Array.from({ length: poly.sides }, (_, j) => [
                    poly.radius * Math.cos(j * angle - Math.PI / 2),
                    poly.radius * Math.sin(j * angle - Math.PI / 2),
                  ]).flat();
                  return (
                    <KonvaLine
                      key={i}
                      points={points}
                      closed
                      fill={shapeColor}
                      globalCompositeOperation={shapeOperation}
                      rotation={
                        poly.rotation ? (poly.rotation * 180) / Math.PI : 0
                      }
                      x={poly.x}
                      y={poly.y}
                    />
                  );
                } else if (shape.tool === "free") {
                  const center = getShapeCenter(shape);
                  return (
                    <KonvaLine
                      key={i}
                      points={shape.points.flatMap((p) => [
                        p.x - center.x,
                        p.y - center.y,
                      ])}
                      stroke={shapeColor}
                      strokeWidth={shape.thickness || thickness}
                      lineCap="round"
                      lineJoin="round"
                      tension={0.5}
                      globalCompositeOperation={shapeOperation}
                      rotation={
                        shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                      }
                      x={center.x}
                      y={center.y}
                    />
                  );
                }
                return null;
              })}
              {/* Render current drawing shape with mode-aware behavior */}
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
                        stroke={getStrokeColor(drawing)}
                        strokeWidth={drawing.thickness || thickness}
                        dash={[8, 8]}
                        lineCap="round"
                        lineJoin="round"
                        globalCompositeOperation={getCompositeOperation()}
                      />
                    );
                  } else if (drawing.tool === "rect") {
                    return (
                      <KonvaRect
                        x={drawing.x}
                        y={drawing.y}
                        width={drawing.width}
                        height={drawing.height}
                        fill={getFillColor(drawing)}
                        dash={[8, 8]}
                        globalCompositeOperation={getCompositeOperation()}
                      />
                    );
                  } else if (drawing.tool === "roundedRect") {
                    const norm = normalizeRectCoords(
                      drawing.x,
                      drawing.y,
                      drawing.width,
                      drawing.height
                    );
                    return (
                      <KonvaRect
                        x={norm.x}
                        y={norm.y}
                        width={norm.width}
                        height={norm.height}
                        cornerRadius={Math.min(
                          16,
                          norm.width / 2,
                          norm.height / 2
                        )}
                        fill={getFillColor(drawing)}
                        dash={[8, 8]}
                        globalCompositeOperation={getCompositeOperation()}
                      />
                    );
                  } else if (drawing.tool === "triangle") {
                    return (
                      <KonvaLine
                        points={drawing.points.flatMap((p) => [p.x, p.y])}
                        closed
                        fill={getFillColor(drawing)}
                        dash={[8, 8]}
                        globalCompositeOperation={getCompositeOperation()}
                      />
                    );
                  } else if (drawing.tool === "circle") {
                    return (
                      <KonvaCircle
                        x={drawing.x}
                        y={drawing.y}
                        radius={drawing.radius}
                        fill={getFillColor(drawing)}
                        dash={[8, 8]}
                        globalCompositeOperation={getCompositeOperation()}
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
                        fill={getFillColor(drawing)}
                        dash={[8, 8]}
                        globalCompositeOperation={getCompositeOperation()}
                      />
                    );
                  } else if (drawing.tool === "free") {
                    return (
                      <KonvaLine
                        points={drawing.points.flatMap((p) => [p.x, p.y])}
                        stroke={getStrokeColor(drawing)}
                        strokeWidth={drawing.thickness || thickness}
                        dash={[4, 4]}
                        lineCap="round"
                        lineJoin="round"
                        tension={0.5}
                        globalCompositeOperation={getCompositeOperation()}
                      />
                    );
                  }
                  return null;
                })()}

              {/* Grid - only visible in carved-out areas (underneath the black stone) */}
              {showGrid && (
                <React.Fragment>
                  <CustomGrid
                    gridSize={gridSize}
                    width={canvasWidth}
                    height={canvasHeight}
                    globalCompositeOperation="destination-over"
                    strokeColor={underlayerColor}
                  />
                </React.Fragment>
              )}
            </Layer>
            {/* Icon/Text Layer (above mask) */}
            <Layer id="icon-layer">
              {shapes.map((shape, i) => {
                const isSelected = tool === "select" && i === selectedIndex;
                // Render icons, doors, and all visible shapes
                if (shape.tool === "icon") {
                  const iconShape = shape as IconShape;
                  const iconSize = (iconShape as any).size || 32; // Use size property or default to 32
                  return (
                    <React.Fragment key={i}>
                      <KonvaText
                        x={iconShape.x}
                        y={iconShape.y}
                        text={iconShape.icon}
                        fontSize={iconSize}
                        fontStyle="bold"
                        fill="#222"
                        offsetX={iconSize / 2}
                        offsetY={iconSize / 2}
                        rotation={
                          iconShape.rotation
                            ? (iconShape.rotation * 180) / Math.PI
                            : 0
                        }
                      />
                      {isSelected && (
                        <KonvaRect
                          x={iconShape.x}
                          y={iconShape.y}
                          width={iconSize + 6}
                          height={iconSize + 6}
                          stroke="#1e90ff"
                          strokeWidth={2}
                          dash={[4, 4]}
                          cornerRadius={8}
                          offsetX={(iconSize + 6) / 2}
                          offsetY={(iconSize + 6) / 2}
                          rotation={
                            iconShape.rotation
                              ? (iconShape.rotation * 180) / Math.PI
                              : 0
                          }
                        />
                      )}
                    </React.Fragment>
                  );
                }
                if (shape.tool === "door") {
                  // Draw a filled rectangle for the door (above mask)
                  const doorW =
                    shape.orientation === "horizontal"
                      ? Math.abs(shape.width)
                      : Math.abs(shape.height);
                  const doorH =
                    shape.orientation === "horizontal"
                      ? Math.abs(shape.height)
                      : Math.abs(shape.width);

                  // Ensure minimum visibility
                  const actualDoorW = Math.max(8, doorW);
                  const actualDoorH = Math.max(4, doorH);

                  return (
                    <React.Fragment key={i}>
                      <KonvaRect
                        x={shape.x}
                        y={shape.y}
                        width={actualDoorW}
                        height={actualDoorH}
                        fill="#fff"
                        stroke="#222"
                        strokeWidth={2}
                        offsetX={actualDoorW / 2}
                        offsetY={actualDoorH / 2}
                        rotation={
                          shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                        }
                      />
                      {isSelected && (
                        <KonvaRect
                          x={shape.x}
                          y={shape.y}
                          width={actualDoorW + 6}
                          height={actualDoorH + 6}
                          stroke="#1e90ff"
                          strokeWidth={2}
                          dash={[4, 4]}
                          cornerRadius={6}
                          offsetX={(actualDoorW + 6) / 2}
                          offsetY={(actualDoorH + 6) / 2}
                          rotation={
                            shape.rotation
                              ? (shape.rotation * 180) / Math.PI
                              : 0
                          }
                        />
                      )}
                    </React.Fragment>
                  );
                }
                // Render visible outlines for selected shapes (always use original shape color)
                if (shape.tool === "rect") {
                  const center = getShapeCenter(shape);
                  return (
                    <React.Fragment key={i}>
                      <KonvaRect
                        x={center.x}
                        y={center.y}
                        width={shape.width}
                        height={shape.height}
                        stroke={isSelected ? shape.color : undefined}
                        strokeWidth={
                          isSelected ? shape.thickness || thickness : 0
                        }
                        fillEnabled={false}
                        rotation={
                          shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                        }
                        offsetX={center.x - shape.x}
                        offsetY={center.y - shape.y}
                      />
                      {isSelected && (
                        <KonvaRect
                          x={center.x}
                          y={center.y}
                          width={shape.width + 6}
                          height={shape.height + 6}
                          stroke="#1e90ff"
                          strokeWidth={2}
                          dash={[4, 4]}
                          cornerRadius={4}
                          rotation={
                            shape.rotation
                              ? (shape.rotation * 180) / Math.PI
                              : 0
                          }
                          offsetX={center.x - (shape.x - 3)}
                          offsetY={center.y - (shape.y - 3)}
                        />
                      )}
                    </React.Fragment>
                  );
                }
                if (shape.tool === "roundedRect") {
                  const norm = normalizeRectCoords(
                    shape.x,
                    shape.y,
                    shape.width,
                    shape.height
                  );
                  const center = getShapeCenter(shape);
                  return (
                    <React.Fragment key={i}>
                      <KonvaRect
                        x={center.x}
                        y={center.y}
                        width={norm.width}
                        height={norm.height}
                        cornerRadius={Math.min(
                          16,
                          norm.width / 2,
                          norm.height / 2
                        )}
                        stroke={isSelected ? shape.color : undefined}
                        strokeWidth={
                          isSelected ? shape.thickness || thickness : 0
                        }
                        fillEnabled={false}
                        rotation={
                          shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                        }
                        offsetX={center.x - norm.x}
                        offsetY={center.y - norm.y}
                      />
                      {isSelected && (
                        <KonvaRect
                          x={center.x}
                          y={center.y}
                          width={norm.width + 6}
                          height={norm.height + 6}
                          stroke="#1e90ff"
                          strokeWidth={2}
                          dash={[4, 4]}
                          cornerRadius={
                            Math.min(16, norm.width / 2, norm.height / 2) + 2
                          }
                          rotation={
                            shape.rotation
                              ? (shape.rotation * 180) / Math.PI
                              : 0
                          }
                          offsetX={center.x - (norm.x - 3)}
                          offsetY={center.y - (norm.y - 3)}
                        />
                      )}
                    </React.Fragment>
                  );
                }
                if (shape.tool === "triangle") {
                  const center = getShapeCenter(shape);
                  return (
                    <React.Fragment key={i}>
                      <KonvaLine
                        points={shape.points.flatMap((p) => [
                          p.x - center.x,
                          p.y - center.y,
                        ])}
                        closed
                        stroke={isSelected ? shape.color : undefined}
                        strokeWidth={
                          isSelected ? shape.thickness || thickness : 0
                        }
                        fillEnabled={false}
                        rotation={
                          shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                        }
                        x={center.x}
                        y={center.y}
                      />
                      {isSelected && (
                        <KonvaLine
                          points={shape.points.flatMap((p) => {
                            // Create slightly larger outline by expanding from center
                            const px = p.x - center.x;
                            const py = p.y - center.y;
                            const distance = Math.sqrt(px * px + py * py);
                            const expansion = 3; // pixels to expand
                            const factor =
                              distance > 0
                                ? (distance + expansion) / distance
                                : 1;
                            return [px * factor, py * factor];
                          })}
                          closed
                          stroke="#1e90ff"
                          strokeWidth={2}
                          dash={[4, 4]}
                          rotation={
                            shape.rotation
                              ? (shape.rotation * 180) / Math.PI
                              : 0
                          }
                          x={center.x}
                          y={center.y}
                        />
                      )}
                    </React.Fragment>
                  );
                }
                if (shape.tool === "circle") {
                  return (
                    <React.Fragment key={i}>
                      <KonvaCircle
                        x={shape.x}
                        y={shape.y}
                        radius={shape.radius}
                        stroke={isSelected ? shape.color : undefined}
                        strokeWidth={
                          isSelected ? shape.thickness || thickness : 0
                        }
                        fillEnabled={false}
                        rotation={
                          shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                        }
                      />
                      {isSelected && (
                        <KonvaCircle
                          x={shape.x}
                          y={shape.y}
                          radius={shape.radius + 3}
                          stroke="#1e90ff"
                          strokeWidth={2}
                          dash={[4, 4]}
                          rotation={
                            shape.rotation
                              ? (shape.rotation * 180) / Math.PI
                              : 0
                          }
                        />
                      )}
                    </React.Fragment>
                  );
                }
                if (["pentagon", "hexagon", "octagon"].includes(shape.tool)) {
                  const poly = shape as Polygon;
                  const angle = (2 * Math.PI) / poly.sides;
                  const points = Array.from({ length: poly.sides }, (_, j) => [
                    poly.radius * Math.cos(j * angle - Math.PI / 2),
                    poly.radius * Math.sin(j * angle - Math.PI / 2),
                  ]).flat();
                  const outlinePoints = Array.from(
                    { length: poly.sides },
                    (_, j) => [
                      (poly.radius + 3) * Math.cos(j * angle - Math.PI / 2),
                      (poly.radius + 3) * Math.sin(j * angle - Math.PI / 2),
                    ]
                  ).flat();
                  return (
                    <React.Fragment key={i}>
                      <KonvaLine
                        points={points}
                        closed
                        stroke={isSelected ? poly.color : undefined}
                        strokeWidth={
                          isSelected ? poly.thickness || thickness : 0
                        }
                        fillEnabled={false}
                        rotation={
                          poly.rotation ? (poly.rotation * 180) / Math.PI : 0
                        }
                        offsetX={0}
                        offsetY={0}
                        x={poly.x}
                        y={poly.y}
                      />
                      {isSelected && (
                        <KonvaLine
                          points={outlinePoints}
                          closed
                          stroke="#1e90ff"
                          strokeWidth={2}
                          dash={[4, 4]}
                          rotation={
                            poly.rotation ? (poly.rotation * 180) / Math.PI : 0
                          }
                          offsetX={0}
                          offsetY={0}
                          x={poly.x}
                          y={poly.y}
                        />
                      )}
                    </React.Fragment>
                  );
                }
                if (shape.tool === "line") {
                  const center = getShapeCenter(shape);
                  return (
                    <React.Fragment key={i}>
                      <KonvaLine
                        points={[
                          shape.points[0].x - center.x,
                          shape.points[0].y - center.y,
                          shape.points[1].x - center.x,
                          shape.points[1].y - center.y,
                        ]}
                        stroke={isSelected ? shape.color : undefined}
                        strokeWidth={
                          isSelected ? shape.thickness || thickness : 0
                        }
                        lineCap="round"
                        lineJoin="round"
                        fillEnabled={false}
                        rotation={
                          shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                        }
                        x={center.x}
                        y={center.y}
                      />
                      {isSelected && (
                        <KonvaLine
                          points={[
                            shape.points[0].x - center.x,
                            shape.points[0].y - center.y,
                            shape.points[1].x - center.x,
                            shape.points[1].y - center.y,
                          ]}
                          stroke="#1e90ff"
                          strokeWidth={Math.max(
                            4,
                            (shape.thickness || thickness) + 2
                          )}
                          lineCap="round"
                          lineJoin="round"
                          rotation={
                            shape.rotation
                              ? (shape.rotation * 180) / Math.PI
                              : 0
                          }
                          x={center.x}
                          y={center.y}
                        />
                      )}
                    </React.Fragment>
                  );
                }
                if (shape.tool === "free") {
                  const center = getShapeCenter(shape);
                  return (
                    <React.Fragment key={i}>
                      <KonvaLine
                        points={shape.points.flatMap((p) => [
                          p.x - center.x,
                          p.y - center.y,
                        ])}
                        stroke={isSelected ? shape.color : undefined}
                        strokeWidth={
                          isSelected ? shape.thickness || thickness : 0
                        }
                        lineCap="round"
                        lineJoin="round"
                        tension={0.5}
                        fillEnabled={false}
                        rotation={
                          shape.rotation ? (shape.rotation * 180) / Math.PI : 0
                        }
                        x={center.x}
                        y={center.y}
                      />
                      {isSelected && (
                        <KonvaLine
                          points={shape.points.flatMap((p) => [
                            p.x - center.x,
                            p.y - center.y,
                          ])}
                          stroke="#1e90ff"
                          strokeWidth={Math.max(
                            4,
                            (shape.thickness || thickness) + 2
                          )}
                          lineCap="round"
                          lineJoin="round"
                          tension={0.5}
                          rotation={
                            shape.rotation
                              ? (shape.rotation * 180) / Math.PI
                              : 0
                          }
                          x={center.x}
                          y={center.y}
                        />
                      )}
                    </React.Fragment>
                  );
                }
                return null;
              })}

              {/* Door Preview (rendered in icon layer to appear above the cut away) */}
              {drawing &&
                drawing.tool === "door" &&
                (() => {
                  const doorW =
                    drawing.orientation === "horizontal"
                      ? Math.abs(drawing.width)
                      : Math.abs(drawing.height);
                  const doorH =
                    drawing.orientation === "horizontal"
                      ? Math.abs(drawing.height)
                      : Math.abs(drawing.width);

                  // Ensure minimum visibility
                  const actualDoorW = Math.max(8, doorW);
                  const actualDoorH = Math.max(4, doorH);

                  return (
                    <KonvaRect
                      x={drawing.x}
                      y={drawing.y}
                      width={actualDoorW}
                      height={actualDoorH}
                      fill="#fff"
                      stroke="#222"
                      strokeWidth={2}
                      dash={[8, 8]}
                      offsetX={actualDoorW / 2}
                      offsetY={actualDoorH / 2}
                      rotation={
                        drawing.rotation
                          ? (drawing.rotation * 180) / Math.PI
                          : 0
                      }
                    />
                  );
                })()}

              {/* Rotation Handle */}
              {tool === "select" &&
                selectedIndex !== null &&
                selectedIndex >= 0 &&
                selectedIndex < shapes.length &&
                (() => {
                  const shape = shapes[selectedIndex];
                  if (!shape) return null; // Guard against undefined shape
                  const handlePos = getRotationHandlePosition(shape);
                  const center = getShapeCenter(shape);
                  return (
                    <React.Fragment>
                      {/* Line from center to handle */}
                      <KonvaLine
                        points={[center.x, center.y, handlePos.x, handlePos.y]}
                        stroke="#1e90ff"
                        strokeWidth={1}
                        dash={[2, 2]}
                      />
                      {/* Rotation handle circle */}
                      <KonvaCircle
                        x={handlePos.x}
                        y={handlePos.y}
                        radius={10}
                        fill="#1e90ff"
                        stroke="#fff"
                        strokeWidth={3}
                      />
                      {/* Inner circle for better visibility */}
                      <KonvaCircle
                        x={handlePos.x}
                        y={handlePos.y}
                        radius={6}
                        fill="#fff"
                        stroke="#1e90ff"
                        strokeWidth={1}
                      />
                    </React.Fragment>
                  );
                })()}

              {/* Resize Handles */}
              {tool === "select" &&
                selectedIndex !== null &&
                selectedIndex >= 0 &&
                selectedIndex < shapes.length &&
                (() => {
                  const shape = shapes[selectedIndex];
                  if (!shape) return null; // Guard against undefined shape
                  const handles = getResizeHandles(shape);

                  return (
                    <React.Fragment>
                      {handles.map((handle, index) => (
                        <KonvaRect
                          key={`resize-handle-${index}`}
                          x={handle.x - 4}
                          y={handle.y - 4}
                          width={8}
                          height={8}
                          fill="#fff"
                          stroke="#1e90ff"
                          strokeWidth={2}
                        />
                      ))}
                    </React.Fragment>
                  );
                })()}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}

export default DungeonEditor;
