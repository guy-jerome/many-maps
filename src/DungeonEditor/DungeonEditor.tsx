import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import useSnapToGrid from './hooks/useSnapToGrid';
import { exportToImage } from './utils/exportToImage';
import GridLayer from './components/GridLayer';
import WallLayer from './components/WallLayer';
import RoomLayer from './components/RoomLayer';
import Toolbar from './components/Toolbar';
import CanvasContainer from './components/CanvasContainer';

type ShapeType =
  | { type: 'wall'; points: number[]; id: string }
  | { type: 'room'; x: number; y: number; width: number; height: number; id: string };

const DungeonEditor: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const [mode, setMode] = useState<'wall' | 'room' | 'pan'>('wall');
  const [cellSize, setCellSize] = useState<number>(50);
  const [shapes, setShapes] = useState<ShapeType[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentLinePoints, setCurrentLinePoints] = useState<number[] | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const stageRef = useRef<any>(null);

  const snap = useSnapToGrid(cellSize);
  const width = 800;
  const height = 600;

  // Mouse down starts drawing in wall or room mode
  const handleMouseDown = () => {
    if (mode === 'wall' || mode === 'room') {
      const stage = stageRef.current;
      if (!stage) return;
      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;
        const stagePos = stage.position(); // <- accounts for pan/drag
        const x = snap(pointerPos.x - stagePos.x);
        const y = snap(pointerPos.y - stagePos.y);
      setStartPos({ x, y });
      setIsDrawing(true);
      if (mode === 'wall') {
        setCurrentLinePoints([x, y, x, y]);
      } else if (mode === 'room') {
        setCurrentRect({ x, y, width: 0, height: 0 });
      }
    }
  };

  // Mouse move updates the preview shape
  const handleMouseMove = () => {
    if (!isDrawing || mode === 'pan') return;
    const stage = stageRef.current;
    if (!stage || !startPos) return;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    const stagePos = stage.position(); // <- accounts for pan/drag
    const x = snap(pointerPos.x - stagePos.x);
    const y = snap(pointerPos.y - stagePos.y);

    if (mode === 'wall') {
      setCurrentLinePoints([startPos.x, startPos.y, x, y]);
    } else if (mode === 'room') {
      const newX = Math.min(startPos.x, x);
      const newY = Math.min(startPos.y, y);
      const newWidth = Math.abs(x - startPos.x);
      const newHeight = Math.abs(y - startPos.y);
      setCurrentRect({ x: newX, y: newY, width: newWidth, height: newHeight });
    }
  };

  // Mouse up finalizes the shape and adds it to state
  const handleMouseUp = () => {
    if (!isDrawing) return;
    if (mode === 'wall' && currentLinePoints) {
      const [x1, y1, x2, y2] = currentLinePoints;
      if (x1 !== x2 || y1 !== y2) {
        const id = `wall-${Date.now()}`;
        const newWall: ShapeType = { type: 'wall', points: [x1, y1, x2, y2], id };
        setShapes((prev) => [...prev, newWall]);
      }
      setCurrentLinePoints(null);
    } else if (mode === 'room' && currentRect) {
      const { x, y, width: w, height: h } = currentRect;
      if (w > 0 && h > 0) {
        const id = `room-${Date.now()}`;
        const newRoom: ShapeType = { type: 'room', x, y, width: w, height: h, id };
        setShapes((prev) => [...prev, newRoom]);
      }
      setCurrentRect(null);
    }
    setIsDrawing(false);
    setStartPos(null);
  };

  // Toolbar actions
  const handleUndo = () => {
    setShapes((prev) => prev.slice(0, -1));
  };
  const handleClear = () => {
    setShapes([]);
  };
  const handleSave = () => {
    if (stageRef.current) {
      exportToImage(stageRef.current, `dungeon-${mapId || 'map'}.png`);
    }
  };

  // Separate the shapes by type for each layer
  const walls = shapes.filter((s) => s.type === 'wall') as Extract<ShapeType, { type: 'wall' }>[];
  const rooms = shapes.filter((s) => s.type === 'room') as Extract<ShapeType, { type: 'room' }>[];

  return (
    <div>
      <Toolbar
        mode={mode}
        setMode={setMode}
        cellSize={cellSize}
        setCellSize={setCellSize}
        onUndo={handleUndo}
        onClear={handleClear}
        onSave={handleSave}
      />
      <CanvasContainer
        stageRef={stageRef}
        width={width}
        height={height}
        draggable={mode === 'pan'}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <GridLayer width={width} height={height} cellSize={cellSize} />
        <WallLayer walls={walls} currentLinePoints={currentLinePoints} />
        <RoomLayer rooms={rooms} currentRect={currentRect} />
      </CanvasContainer>
    </div>
  );
};

export default DungeonEditor;
