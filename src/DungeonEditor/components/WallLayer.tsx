import React from 'react';
import { Layer, Line } from 'react-konva';

interface WallShape {
  points: number[];
  id: string;
}

interface WallLayerProps {
  walls: WallShape[];
  currentLinePoints: number[] | null;
}

const WallLayer: React.FC<WallLayerProps> = ({ walls, currentLinePoints }) => {
  return (
    <Layer>
      {walls.map((wall) => (
        <Line
          key={wall.id}
          points={wall.points}
          stroke="#000"
          strokeWidth={5}
        />
      ))}
      {currentLinePoints && currentLinePoints.length > 0 && (
        <Line
          points={currentLinePoints}
          stroke="#000"
          strokeWidth={5}
          dash={[4, 4]}
        />
      )}
    </Layer>
  );
};

export default WallLayer;
