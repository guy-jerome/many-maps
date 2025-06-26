/*
  src/DungeonEditor/DungeonEditor.tsx
  Enhanced grid-based dungeon editor with pan/zoom, toolbar, draw-modes, undo/clear functionality.
*/
import React, { useState, useCallback, useRef, JSX } from 'react';
import { Stage, Layer, Line, Rect, Group } from 'react-konva';
import { Button } from 'react-bootstrap';

// Configurable grid and canvas
const DEFAULT_CELL_SIZE = 32;
const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;
const LINE_WIDTH = 2; // Uniform stroke width for all lines

// Types for shapes
interface Wall { id: string; points: number[]; }
interface Room { id: string; x: number; y: number; width: number; height: number; }

enum DrawMode { None = 'none', Wall = 'wall', Room = 'room' }

const DungeonEditor: React.FC = () => {
  const [cellSize] = useState(DEFAULT_CELL_SIZE);
  const [width] = useState(DEFAULT_WIDTH);
  const [height] = useState(DEFAULT_HEIGHT);
  const [mode, setMode] = useState<DrawMode>(DrawMode.None);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [drawingShape, setDrawingShape] = useState<Wall | Room | null>(null);
  const stageRef = useRef<any>(null);

  // Generate grid lines once
  const gridLines = React.useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let x = 0; x <= width; x += cellSize) {
      lines.push(<Line key={`v${x}`} points={[x, 0, x, height]} stroke="#ddd" strokeWidth={LINE_WIDTH} />);
    }
    for (let y = 0; y <= height; y += cellSize) {
      lines.push(<Line key={`h${y}`} points={[0, y, width, y]} stroke="#ddd" strokeWidth={LINE_WIDTH} />);
    }
    return lines;
  }, [width, height, cellSize]);

  // Snap to grid helper
  const snap = (val: number) => Math.round(val / cellSize) * cellSize;

  // Mouse events for drawing
  const handleMouseDown = useCallback((e: any) => {
    if (mode === DrawMode.None) return;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;
    const x = snap(pos.x), y = snap(pos.y);

    if (mode === DrawMode.Wall) {
      const id = `${Date.now()}`;
      setDrawingShape({ id, points: [x, y, x, y] });
    }
    if (mode === DrawMode.Room) {
      const id = `${Date.now()}`;
      setDrawingShape({ id, x, y, width: 0, height: 0 } as Room);
    }
  }, [mode, snap]);

  const handleMouseMove = useCallback((e: any) => {
    if (!drawingShape) return;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;
    const x = snap(pos.x), y = snap(pos.y);

    if ('points' in drawingShape) {
      // update wall end
      setDrawingShape({ ...drawingShape, points: [drawingShape.points[0], drawingShape.points[1], x, y] });
    } else {
      // update room size
      const room = drawingShape as Room;
      setDrawingShape({ ...room, width: x - room.x, height: y - room.y } as Room);
    }
  }, [drawingShape, snap]);

  const handleMouseUp = useCallback(() => {
    if (!drawingShape) return;
    if ('points' in drawingShape) {
      setWalls(walls => [...walls, drawingShape as Wall]);
    } else {
      const room = drawingShape as Room;
      // only add if valid size
      if (Math.abs(room.width) >= cellSize && Math.abs(room.height) >= cellSize) {
        setRooms(rs => [...rs, room]);
      }
    }
    setDrawingShape(null);
  }, [drawingShape, cellSize]);

  // Undo and clear
  const undo = () => {
    if (mode === DrawMode.Wall) setWalls(walls => walls.slice(0, -1));
    if (mode === DrawMode.Room) setRooms(rooms => rooms.slice(0, -1));
  };
  const clearAll = () => { setWalls([]); setRooms([]); };

  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div>
        <h3>Toolbar</h3>
        <Button variant={mode === DrawMode.Wall ? 'primary' : 'outline-primary'} onClick={() => setMode(DrawMode.Wall)}>Draw Wall</Button>{' '}
        <Button variant={mode === DrawMode.Room ? 'primary' : 'outline-primary'} onClick={() => setMode(DrawMode.Room)}>Draw Room</Button>{' '}
        <Button variant="secondary" onClick={() => setMode(DrawMode.None)}>Pan/Select</Button>
        <hr />
        <Button onClick={undo} disabled={!(walls.length || rooms.length)}>Undo</Button>{' '}
        <Button onClick={clearAll} variant="danger" disabled={!(walls.length || rooms.length)}>Clear All</Button>
      </div>

      <Stage
        width={width}
        height={height}
        draggable={mode === DrawMode.None}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
        style={{ border: '1px solid #ccc', backgroundColor: '#fafafa' }}
      >
        <Layer>
          {/* grid */}
          {gridLines}
          {/* existing walls */}
          {walls.map(w => <Line key={w.id} points={w.points} stroke="#333" strokeWidth={LINE_WIDTH} />)}
          {/* existing rooms */}
          {rooms.map(r => (
            <Group key={r.id}>
              <Rect x={r.x} y={r.y} width={r.width} height={r.height} stroke="#333" strokeWidth={LINE_WIDTH} fillOpacity={0.1} />
            </Group>
          ))}
          {/* preview shape */}
          {drawingShape && 'points' in drawingShape && (
            <Line points={drawingShape.points} stroke="blue" strokeWidth={LINE_WIDTH} dash={[4, 4]} />
          )}
          {drawingShape && !('points' in drawingShape) && (() => {
            const r = drawingShape as Room;
            return <Rect x={r.x} y={r.y} width={r.width} height={r.height} stroke="blue" strokeWidth={LINE_WIDTH} dash={[4,4]} />;
          })()}
        </Layer>
      </Stage>
    </div>
  );
};

export default DungeonEditor;
