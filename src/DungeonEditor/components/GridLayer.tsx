import React, { JSX } from 'react';
import { Layer, Line } from 'react-konva';

interface GridLayerProps {
  width: number;
  height: number;
  cellSize: number;
}

const GridLayer: React.FC<GridLayerProps> = ({ width, height, cellSize }) => {
  const lines: JSX.Element[] = [];
  for (let x = 0; x <= width; x += cellSize) {
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, height]}
        stroke="#ccc"
        strokeWidth={1}
      />
    );
  }
  for (let y = 0; y <= height; y += cellSize) {
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, width, y]}
        stroke="#ccc"
        strokeWidth={1}
      />
    );
  }
  return <Layer>{lines}</Layer>;
};

export default GridLayer;
