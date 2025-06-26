import React from 'react';
import { Layer, Rect } from 'react-konva';

interface RoomShape {
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
}

interface RoomLayerProps {
  rooms: RoomShape[];
  currentRect: { x: number; y: number; width: number; height: number } | null;
}

const RoomLayer: React.FC<RoomLayerProps> = ({ rooms, currentRect }) => {
  return (
    <Layer>
      {rooms.map((room) => (
        <Rect
          key={room.id}
          x={room.x}
          y={room.y}
          width={room.width}
          height={room.height}
          stroke="#000"
          strokeWidth={5}
        />
      ))}
      {currentRect && currentRect.width !== 0 && currentRect.height !== 0 && (
        <Rect
          x={currentRect.x}
          y={currentRect.y}
          width={currentRect.width}
          height={currentRect.height}
          stroke="#000"
          strokeWidth={5}
          dash={[4, 4]}
        />
      )}
    </Layer>
  );
};

export default RoomLayer;
