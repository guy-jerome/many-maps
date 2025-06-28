// src/components/GridLayer.tsx
import { Layer, Line } from "react-konva";
interface Props {
  width: number;
  height: number;
  cellSize: number;
}
export default function GridLayer({ width, height, cellSize }: Props) {
  const lines = [];
  for (let x = 0; x <= width; x += cellSize)
    lines.push(
      <Line
        key={`v${x}`}
        points={[x, 0, x, height]}
        stroke="#ccc"
        strokeWidth={1}
        listening={false}
      />
    );
  for (let y = 0; y <= height; y += cellSize)
    lines.push(
      <Line
        key={`h${y}`}
        points={[0, y, width, y]}
        stroke="#ccc"
        strokeWidth={1}
        listening={false}
      />
    );
  return <Layer>{lines}</Layer>;
}
