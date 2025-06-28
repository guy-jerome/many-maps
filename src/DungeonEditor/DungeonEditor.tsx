// src/DungeonEditor.tsx
import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import useSnapToGrid from "./hooks/useSnapToGrid";
import useHistory from "./hooks/useHistory";
import useBackground from "./hooks/useBackground";
import { exportToImage, saveMapState, loadMapState } from "./utils/mapUtils";
import CanvasContainer from "./components/CanvasContainer";
import GridLayer from "./components/GridLayer";
import WallLayer from "./components/WallLayer";
import RoomLayer from "./components/RoomLayer";
import DoorLayer from "./components/DoorLayer";
import CircleLayer from "./components/CircleLayer";
import FreehandLayer from "./components/FreehandLayer";
import TokenLayer from "./components/TokenLayer";
import TextLayer from "./components/TextLayer";
import Toolbar from "./components/Toolbar";

type Shape =
  | {
      type: "wall";
      points: number[];
      id: string;
      stroke: string;
      strokeWidth: number;
    }
  | {
      type: "room";
      x: number;
      y: number;
      width: number;
      height: number;
      id: string;
      stroke: string;
      fill: string;
      strokeWidth: number;
    }
  | {
      type: "door";
      points: number[];
      id: string;
      stroke: string;
      strokeWidth: number;
      open: boolean;
    }
  | {
      type: "circle";
      x: number;
      y: number;
      radius: number;
      id: string;
      stroke: string;
      fill: string;
      strokeWidth: number;
    }
  | {
      type: "freehand";
      points: number[];
      id: string;
      stroke: string;
      strokeWidth: number;
    }
  | {
      type: "text";
      x: number;
      y: number;
      text: string;
      id: string;
      fontSize: number;
      fill: string;
    }
  | {
      type: "token";
      x: number;
      y: number;
      id: string;
      src: string;
      width: number;
      height: number;
      rotation: number;
    };

const DungeonEditor: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const stageRef = useRef<any>(null);

  /** Tool and UI state **/
  const [mode, setMode] = useState<
    | "select"
    | "wall"
    | "room"
    | "door"
    | "circle"
    | "freehand"
    | "text"
    | "token"
    | "eraser"
    | "pan"
  >("select");
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [fontSize, setFontSize] = useState(18);

  /** Background, grid, snapping **/
  const { bgColor, setBgColor } = useBackground("#ffffff");
  const [gridOn, setGridOn] = useState(true);
  const [snapOn, setSnapOn] = useState(true);
  const [cellSize, setCellSize] = useState(50);
  const snap = useSnapToGrid(cellSize, snapOn);

  /** Shapes and History **/
  const {
    state: shapes,
    setState: setShapes,
    undo,
    redo,
  } = useHistory<Shape[]>({ initial: [] });

  /** Draft drawing state **/
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [draftPoints, setDraftPoints] = useState<number[] | null>(null);
  const [draftRect, setDraftRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [draftCircle, setDraftCircle] = useState<{
    x: number;
    y: number;
    radius: number;
  } | null>(null);

  /** Load saved state on mount **/
  useEffect(() => {
    const saved = loadMapState(mapId || "default");
    if (saved) {
      setBgColor(saved.bgColor);
      setCellSize(saved.cellSize);
      setGridOn(saved.gridOn);
      setShapes(saved.shapes);
    }
  }, [mapId]);

  /** Transform pointer to stage coordinates accounting for pan/zoom **/
  const getStageCoords = () => {
    const stage = stageRef.current;
    if (!stage) return null;
    // Get pointer position relative to container
    const pointer = stage.getPointerPosition();
    if (!pointer) return null;
    // Invert the stage transform to map to untransformed coords
    const transform = stage.getAbsoluteTransform().copy().invert();
    const pos = transform.point(pointer);
    return { x: pos.x, y: pos.y };
  };

  /** Mouse handlers **/
  const handleMouseDown = () => {
    const pos = getStageCoords();
    if (!pos) return;
    const x = snap(pos.x);
    const y = snap(pos.y);

    if (mode === "wall" || mode === "door" || mode === "freehand") {
      setDrawing(true);
      setDraftPoints([x, y]);
    } else if (mode === "room") {
      setDrawing(true);
      setStartPos({ x, y });
      setDraftRect({ x, y, width: 0, height: 0 });
    } else if (mode === "circle") {
      setDrawing(true);
      setStartPos({ x, y });
      setDraftCircle({ x, y, radius: 0 });
    } else if (mode === "text") {
      const text = prompt("Enter label text");
      if (text) {
        const id = `text-${Date.now()}`;
        setShapes([
          ...shapes,
          { type: "text", x, y, text, id, fontSize, fill: strokeColor },
        ]);
      }
    } else if (mode === "token") {
      const url = prompt("Enter token image URL");
      if (url) {
        const id = `token-${Date.now()}`;
        setShapes([
          ...shapes,
          {
            type: "token",
            x,
            y,
            id,
            src: url,
            width: 50,
            height: 50,
            rotation: 0,
          },
        ]);
      }
    } else if (mode === "eraser") {
      const stage = stageRef.current;
      const shape = stage.getIntersection(stage.getPointerPosition());
      if (shape && shape.getAttr("id")) {
        setShapes(shapes.filter((s) => s.id !== shape.getAttr("id")));
      }
    }
  };

  const handleMouseMove = () => {
    if (!drawing) return;
    const pos = getStageCoords();
    if (!pos) return;
    const x = snap(pos.x),
      y = snap(pos.y);

    if (mode === "freehand" && draftPoints) {
      setDraftPoints([...draftPoints, x, y]);
    } else if ((mode === "wall" || mode === "door") && draftPoints) {
      setDraftPoints([draftPoints[0], draftPoints[1], x, y]);
    } else if (mode === "room" && startPos) {
      const newX = Math.min(startPos.x, x),
        newY = Math.min(startPos.y, y);
      setDraftRect({
        x: newX,
        y: newY,
        width: Math.abs(x - startPos.x),
        height: Math.abs(y - startPos.y),
      });
    } else if (mode === "circle" && startPos) {
      const dx = x - startPos.x;
      const dy = y - startPos.y;
      setDraftCircle({
        x: startPos.x,
        y: startPos.y,
        radius: Math.sqrt(dx * dx + dy * dy),
      });
    }
  };

  const handleMouseUp = () => {
    if (!drawing) return;
    let newShape: Shape | undefined;
    if (mode === "freehand" && draftPoints) {
      newShape = {
        type: "freehand",
        points: draftPoints,
        id: `freehand-${Date.now()}`,
        stroke: strokeColor,
        strokeWidth,
      };
    } else if (mode === "wall" && draftPoints?.length === 4) {
      newShape = {
        type: "wall",
        points: draftPoints,
        id: `wall-${Date.now()}`,
        stroke: strokeColor,
        strokeWidth,
      };
    } else if (mode === "door" && draftPoints?.length === 4) {
      newShape = {
        type: "door",
        points: draftPoints,
        id: `door-${Date.now()}`,
        stroke: strokeColor,
        strokeWidth,
        open: false,
      };
    } else if (mode === "room" && draftRect) {
      newShape = {
        type: "room",
        x: draftRect.x,
        y: draftRect.y,
        width: draftRect.width,
        height: draftRect.height,
        id: `room-${Date.now()}`,
        stroke: strokeColor,
        fill: fillColor,
        strokeWidth,
      };
    } else if (mode === "circle" && draftCircle) {
      newShape = {
        type: "circle",
        x: draftCircle.x,
        y: draftCircle.y,
        radius: draftCircle.radius,
        id: `circle-${Date.now()}`,
        stroke: strokeColor,
        fill: fillColor,
        strokeWidth,
      };
    }
    if (newShape) setShapes([...shapes, newShape]);
    setDrawing(false);
    setDraftPoints(null);
    setDraftRect(null);
    setDraftCircle(null);
    setStartPos(null);
  };

  /** Toolbar actions **/
  const handleUndo = () => undo();
  const handleRedo = () => redo();
  const handleClear = () => setShapes([]);
  const handleSaveImage = () =>
    exportToImage(stageRef.current, `dungeon-${mapId || "map"}.png`);
  const handleSaveJSON = () =>
    saveMapState(mapId || "default", {
      shapes,
      bgColor,
      gridOn,
      snapOn,
      cellSize,
    });

  return (
    <div>
      <Toolbar
        mode={mode}
        setMode={setMode}
        strokeColor={strokeColor}
        setStrokeColor={setStrokeColor}
        fillColor={fillColor}
        setFillColor={setFillColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
        fontSize={fontSize}
        setFontSize={setFontSize}
        bgColor={bgColor}
        setBgColor={setBgColor}
        gridOn={gridOn}
        setGridOn={setGridOn}
        snapOn={snapOn}
        setSnapOn={setSnapOn}
        cellSize={cellSize}
        setCellSize={setCellSize}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClear}
        onSaveImage={handleSaveImage}
        onSaveJSON={handleSaveJSON}
      />

      <CanvasContainer
        stageRef={stageRef}
        width={1000}
        height={800}
        draggable={mode === "pan"}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {gridOn && <GridLayer width={1000} height={800} cellSize={cellSize} />}
        <RoomLayer
          rooms={shapes.filter((s) => s.type === "room") as any}
          draftRect={draftRect}
        />
        <WallLayer walls={shapes.filter((s) => s.type === "wall") as any} />
        <DoorLayer doors={shapes.filter((s) => s.type === "door") as any} />
        <CircleLayer
          circles={shapes.filter((s) => s.type === "circle") as any}
          draft={draftCircle}
        />
        <FreehandLayer
          lines={shapes.filter((s) => s.type === "freehand") as any}
          current={draftPoints}
        />
        <TextLayer texts={shapes.filter((s) => s.type === "text") as any} />
        <TokenLayer tokens={shapes.filter((s) => s.type === "token") as any} />
      </CanvasContainer>
    </div>
  );
};

export default DungeonEditor;
