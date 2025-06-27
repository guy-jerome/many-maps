import React from 'react';
import { Layer, Circle } from 'react-konva';

interface CircleShape {
  x: number;
  y: number;
  radius: number;
  id: string;
  stroke: string;
  fill: string;
  strokeWidth: number;
}

interface CircleLayerProps {
  circles: CircleShape[];
  draft: { x: number; y: number; radius: number} | null;
}

const CircleLayer: React.FC<CircleLayerProps> = ({ circles, draft }) => {
  return (
    <Layer>
      {/* Render finalized circles */}
      {circles.map((c) => (
        <Circle
          key={c.id}
          id={c.id}
          x={c.x}
          y={c.y}
          radius={c.radius}
          stroke={c.stroke}
          fill={c.fill}
          strokeWidth={c.strokeWidth}
        />
      ))}

      {/* Render draft circle with dashed outline */}
      {draft && draft.radius > 0 && (
        <Circle
          x={draft.x}
          y={draft.y}
          radius={draft.radius}
          stroke="#000000"
          dash={[4, 4]}
          listening={false}
        />
      )}
    </Layer>
  );
};

export default CircleLayer;
