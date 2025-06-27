// src/components/RoomLayer.tsx
import React from 'react';
import { Layer, Rect } from 'react-konva';

interface RoomShape {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  stroke: string;
  strokeWidth: number;
}

interface RoomLayerProps {
  rooms: RoomShape[];
  draftRect?: { x: number; y: number; width: number; height: number } | null;
}

const RoomLayer: React.FC<RoomLayerProps> = ({ rooms, draftRect }) => {
  return (
    <Layer>
      {/* Final rooms: only strokes, no fill */}
      {rooms.map((r) => (
        <Rect
          key={r.id}
          id={r.id}
          x={r.x}
          y={r.y}
          width={r.width}
          height={r.height}
          stroke={r.stroke}
          strokeWidth={r.strokeWidth}
          fill="transparent"
        />
      ))}

      {/* Draft room preview */}
      {draftRect && draftRect.width > 0 && draftRect.height > 0 && (
        <Rect
          x={draftRect.x}
          y={draftRect.y}
          width={draftRect.width}
          height={draftRect.height}
          stroke="#000"
          strokeWidth={1}
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Layer>
  );
};

export default RoomLayer;
