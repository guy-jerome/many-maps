// src/components/WallLayer.tsx
import { Layer, Line } from 'react-konva';
interface Wall { points:number[]; id:string; stroke:string; strokeWidth:number; }
interface Props { walls:Wall[]; }
export default function WallLayer({walls}:Props){
  return (
    <Layer>
      {walls.map(w=><Line key={w.id} id={w.id} points={w.points} stroke={w.stroke} strokeWidth={w.strokeWidth} lineCap="round" />)}
    </Layer>
  );
}